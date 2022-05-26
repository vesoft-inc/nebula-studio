package auth

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/gateway/dao"
	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/gateway/pool"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/config"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/pkg/utils"
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

var (
	TokenName = "explorer_token"
	NSIDName  = "explorer_nsid"
)

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

func ParseConnectDBParams(params *types.ConnectDBParams, config *config.Config) (string, *pool.ClientInfo, error) {
	tokenSplit := strings.Split(params.Authorization, " ")
	if len(tokenSplit) != 2 {
		return "", nil, ecode.WithCode(ecode.ErrParam, nil, "invalid authorization")
	}

	decode, err := base64.StdEncoding.DecodeString(tokenSplit[1])
	if err != nil {
		return "", nil, ecode.WithCode(ecode.ErrParam, err)
	}

	loginInfo := strings.Split(string(decode), ":")
	if len(loginInfo) < 2 {
		return "", nil, ecode.WithCode(ecode.ErrParam, nil, "len of account is less than two")
	}

	username, password := loginInfo[0], loginInfo[1]
	clientInfo, err := dao.Connect(params.Address, params.Port, username, password)
	if err != nil {
		return "", nil, ecode.WithCode(ecode.ErrInternalServer, err)
	}

	tokenString, err := CreateToken(
		&AuthData{
			Address:  params.Address,
			Port:     params.Port,
			Username: username,
			Password: password,
		},
		config,
	)
	return tokenString, clientInfo, err
}

func AuthMiddlewareWithCtx(svcCtx *svc.ServiceContext) rest.Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			if utils.PathHasPrefix(r.URL.Path, []string{"/api-nebula/db/connect", "/api-nebula/db/disconnect"}) {
				next(w, r)
				return
			}

			tokenCookie, tokenErr := r.Cookie(TokenName)
			if tokenErr != nil {
				svcCtx.ResponseHandler.Handle(w, r, nil, ecode.WithSessionMessage(tokenErr))
				return
			}

			auth, authErr := Decode(tokenCookie.Value, svcCtx.Config.Auth.AccessSecret)
			if authErr != nil {
				svcCtx.ResponseHandler.Handle(w, r, nil, ecode.WithSessionMessage(authErr))
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
