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
	nebula "github.com/vesoft-inc/nebula-go/v3"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/config"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/client"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
	"github.com/zeromicro/go-zero/rest"
)

type (
	CtxKeyUserInfo struct{}

	AuthData struct {
		Address  string `json:"address"`
		Port     int    `json:"port"`
		Username string `json:"username"`
		Password string `json:"password"`
		NSID     string `json:"nsid"`
	}

	authClaims struct {
		*AuthData
		jwt.RegisteredClaims
	}
)

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
	expiresAt := now.Add(time.Duration(config.Auth.AccessExpire) * time.Second).Unix()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256,
		authClaims{
			AuthData: authData,
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: &jwt.NumericDate{Time: time.Unix(expiresAt, 0)},
				// ExpiresAt: expiresAt,
			},
		})

	return token.SignedString([]byte(config.Auth.AccessSecret))
}

func Decode(tokenString, secret string) (*AuthData, error) {
	auth := authClaims{}
	token, err := jwt.ParseWithClaims(tokenString, &auth, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		if ve, ok := err.(*jwt.ValidationError); ok {
			if ve.Errors&jwt.ValidationErrorMalformed != 0 {
				return nil, errors.New("that's not even a token")
			} else if ve.Errors&jwt.ValidationErrorExpired != 0 {
				return nil, errors.New("token is expired")
			} else if ve.Errors&jwt.ValidationErrorNotValidYet != 0 {
				return nil, errors.New("token not active yet")
			} else {
				return nil, errors.New("couldn't handle this token")
			}
		}
	}

	if _, ok := token.Claims.(*authClaims); !ok || !token.Valid {
		return nil, errors.New("couldn't handle this token")
	}

	return auth.AuthData, nil
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
	// set Graph Service connect timeout 8h, which is 0s default(means no timeout)
	poolCfg := nebula.GetDefaultConf()
	poolCfg.TimeOut = GraphServiceTimeout
	clientInfo, err := client.NewClient(params.Address, params.Port, username, password, poolCfg)
	if err != nil {
		return "", err
	}

	tokenString, err := CreateToken(
		&AuthData{
			Address:  params.Address,
			Port:     params.Port,
			Username: username,
			Password: password,
			NSID:     clientInfo.ClientID,
		},
		config,
	)
	return tokenString, nil
}

func AuthMiddlewareWithCtx(svcCtx *svc.ServiceContext) rest.Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			if utils.PathHasPrefix(r.URL.Path, []string{"/api-nebula/db/connect", "/nebula_ws"}) {
				next(w, r)
				return
			}

			isDisconnectPath := utils.PathHasPrefix(r.URL.Path, []string{"/api-nebula/db/disconnect"})

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

			auth, authErr := Decode(tokenCookie.Value, svcCtx.Config.Auth.AccessSecret)
			if authErr != nil {
				// for: invalid token...
				if isDisconnectPath {
					next(w, r)
				} else {
					svcCtx.ResponseHandler.Handle(w, r, nil, withErrorMessage(ecode.ErrSession, authErr))
				}
				return
			}

			// for: server restart...
			_, clientErr := client.GetClient(auth.NSID)
			if clientErr != nil && !isDisconnectPath {
				svcCtx.ResponseHandler.Handle(w, r, nil, withErrorMessage(ecode.ErrSession, clientErr))
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
