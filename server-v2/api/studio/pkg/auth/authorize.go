package auth

import (
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/gateway/dao"
	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/gateway/pool"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/config"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/rest/httpx"
)

type (
	CtxKeyUserInfo struct{}

	AuthData struct {
		Address  string `json:"address"`
		Port     int    `json:"port"`
		Username string `json:"username"`
	}

	authClaims struct {
		*AuthData
		jwt.RegisteredClaims
	}
)

var (
	tokenName = "explorer_token"
	nsidName  = "explorer_nsid"
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

func parseConnectDBParams(params *types.ConnectDBParams, config *config.Config) (string, *pool.ClientInfo, error) {
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
		},
		config,
	)
	return tokenString, clientInfo, err
}

func AuthMiddlewareWithCtx(svcCtx *svc.ServiceContext) rest.Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			configAuth := svcCtx.Config.Auth

			// login handler
			if strings.HasSuffix(r.URL.Path, "/connect") {
				var req types.ConnectDBParams
				rClone := utils.CopyHttpRequest(r)
				err := httpx.Parse(rClone, &req)
				if err != nil {
					http.Error(w, err.Error(), http.StatusBadRequest)
					return
				}

				tokenString, clientInfo, err := parseConnectDBParams(&req, &svcCtx.Config)
				if err != nil {
					http.Error(w, err.Error(), http.StatusBadRequest)
					return
				}

				token := http.Cookie{
					Name:     tokenName,
					Value:    tokenString,
					Path:     "/",
					HttpOnly: true,
					MaxAge:   int(configAuth.AccessExpire),
				}
				NSID := http.Cookie{
					Name:     nsidName,
					Value:    clientInfo.ClientID,
					Path:     "/",
					HttpOnly: true,
					MaxAge:   int(configAuth.AccessExpire),
				}

				utils.AddQueryParams(r, map[string]string{"nebulaVersion": string(clientInfo.NebulaVersion)})

				w.Header().Set("Set-Cookie", token.String())
				w.Header().Add("Set-Cookie", NSID.String())

				next(w, r)
				return
			}

			NSIDCookie, NSIDErr := r.Cookie(nsidName)
			if NSIDErr == nil {
				// Add NSID to request query
				utils.AddQueryParams(r, map[string]string{"NSID": NSIDCookie.Value})
			}

			if strings.HasSuffix(r.URL.Path, "/disconnect") {
				w.Header().Set("Set-Cookie", utils.DisabledCookie(tokenName).String())
				w.Header().Add("Set-Cookie", utils.DisabledCookie(nsidName).String())
				next(w, r)
				return
			}

			tokenCookie, tokenErr := r.Cookie(tokenName)
			if NSIDErr != nil || tokenErr != nil {
				if NSIDErr != nil {
					svcCtx.ResponseHandler.Handle(w, r, nil, ecode.WithSessionMessage(NSIDErr))
					return
				}
			}

			auth, authErr := Decode(tokenCookie.Value, configAuth.AccessSecret)
			if authErr != nil {
				svcCtx.ResponseHandler.Handle(w, r, nil, ecode.WithSessionMessage(authErr))
				return
			}

			// Add address|port|username to request query
			utils.AddQueryParams(r, map[string]string{
				"address":  auth.Address,
				"port":     fmt.Sprintf("%d", auth.Port),
				"username": auth.Username,
			})

			next(w, r)
		}
	}
}
