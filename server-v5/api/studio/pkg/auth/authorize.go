package auth

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v4"
	nebula "github.com/vesoft-inc/nebula-ng-tools/golang"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/config"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/utils"
	"github.com/zeromicro/go-zero/rest"
)

type (
	CtxKeyUserInfo struct{}

	AuthData struct {
		Address  string `json:"address"`
		Port     int    `json:"port"`
		Username string `json:"username"`
		Password string `json:"password"`
	}

	authClaims struct {
		*AuthData
		jwt.RegisteredClaims
	}
)

var CtxUserInfoMap map[string]AuthData = make(map[string]AuthData)

// set the timeout for the graph service: 8 hours
// once the timeout is reached, the connection will be closed
// all requests running ngql will be failed, so keepping a long timeout is necessary, make the connection alive
const GraphServiceTimeout = 8 * time.Hour

func IsSessionError(err error) bool {
	subErrMsgStr := []string{
		"session expired",
		"connection refused",
		"broken pipe",
		"an existing connection was forcibly closed",
		"Token is expired",
		"Session not existed",
	}
	for _, subErrMsg := range subErrMsgStr {
		if strings.Contains(err.Error(), subErrMsg) {
			return true
		}
	}
	return false
}

func CreateToken(authData *AuthData, config *config.Config) (string, error) {
	now := time.Now()
	expiresAt := now.Add(time.Duration(config.Auth.TokenMaxAge) * time.Second).Unix()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256,
		authClaims{
			AuthData: authData,
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: &jwt.NumericDate{Time: time.Unix(expiresAt, 0)},
			},
		})

	return token.SignedString([]byte(config.Auth.TokenSecret))
}

func ParseConnectDBParams(params *types.ConnectDBParams, config *config.Config) (string, error) {
	tokenSplit := strings.Split(params.Authorization, " ")
	if len(tokenSplit) != 2 {
		return "", fmt.Errorf("invalid authorization")
	}

	decode, err := base64.StdEncoding.DecodeString(tokenSplit[1])
	if err != nil {
		return "", err
	}

	loginInfo := []string{}
	err = json.Unmarshal(decode, &loginInfo)

	if err != nil {
		return "", err
	}

	if len(loginInfo) < 2 {
		return "", fmt.Errorf("len of account is less than two")
	}

	username, password := loginInfo[0], loginInfo[1]
	host := fmt.Sprintf("%s:%d", params.Address, params.Port)
	client, err := nebula.NewNebulaClient(host, username, password)
	if err != nil {
		return "", err
	}
	defer client.Close()

	tokenString, err := CreateToken(
		&AuthData{
			Address:  params.Address,
			Port:     params.Port,
			Username: username,
			Password: password,
		},
		config,
	)
	return tokenString, err
}

func AuthMiddlewareWithCtx(svcCtx *svc.ServiceContext) rest.Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			if utils.PathHasPrefix(r.URL.Path, []string{"/api-studio/db/connect", "/nebula_ws"}) {
				next(w, r)
				return
			}

			isDisconnectPath := utils.PathHasPrefix(r.URL.Path, []string{"/api-studio/db/disconnect"})

			tokenCookie, tokenErr := r.Cookie(svcCtx.Config.Auth.TokenName)
			withErrorMessage := utils.ErrMsgWithLogger(r.Context())
			if tokenErr != nil {
				// for: empty token...
				if isDisconnectPath {
					next(w, r)
				} else {
					svcCtx.ResponseHandler.Handle(w, r, nil, withErrorMessage(ecode.ErrSession, tokenErr))
				}
				return
			}

			auth, authErr := Decode(tokenCookie.Value, svcCtx.Config.Auth.TokenSecret)
			if authErr != nil {
				// for: invalid token...
				if isDisconnectPath {
					next(w, r)
				} else {
					svcCtx.ResponseHandler.Handle(w, r, nil, withErrorMessage(ecode.ErrSession, authErr))
				}
				return
			}

			/**
			 * Add auth to request context
			 *
			 * Get auth from context:
			 * auth := s.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
			 */
			r = r.WithContext(context.WithValue(r.Context(), CtxKeyUserInfo{}, auth))

			next(w, r)
		}
	}
}

func Decode(tokenString, secret string) (*AuthData, error) {
	claims := authClaims{}
	token, err := jwt.ParseWithClaims(tokenString, &claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	// Capturing signature invalid error in the situation of data tamper,
	// other validation errors are ignored
	if ve, ok := err.(*jwt.ValidationError); ok {
		if ve.Errors == jwt.ValidationErrorSignatureInvalid {
			return nil, errors.New("token signature validation failed")
		}
	}

	if _, ok := token.Claims.(*authClaims); !ok {
		return nil, errors.New("couldn't handle this token")
	}

	return claims.AuthData, nil
}
