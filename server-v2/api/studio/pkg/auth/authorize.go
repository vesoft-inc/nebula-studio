package auth

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/gateway/dao"
	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/gateway/pool"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/config"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/rest/httpx"
)

type (
	CtxKeyUserInfo struct{}

	AuthData struct {
		NebulaAddress string `json:"nebulaAddress"`
		Username      string `json:"username"`
		ClientID      string `json:"clientID"`
	}

	authClaims struct {
		*AuthData
		jwt.StandardClaims
	}
)

var globalConfig = new(config.Config)

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
			NebulaAddress: params.Address,
			Username:      username,
		},
		config,
	)
	return tokenString, clientInfo, err
}

func CreateToken(authData *AuthData, config *config.Config) (string, error) {
	now := time.Now()
	expiresAt := now.Add(time.Duration(config.Auth.AccessExpire) * time.Second).Unix()

	token := jwt.NewWithClaims(jwt.SigningMethodHS256,
		authClaims{
			AuthData: authData,
			StandardClaims: jwt.StandardClaims{
				ExpiresAt: expiresAt,
			},
		})

	return token.SignedString([]byte(config.Auth.AccessSecret))
}

func AuthMiddlewareWithConfig(config *config.Config) rest.Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			// login handler
			if strings.HasSuffix(r.URL.Path, "/connect") {
				var req types.ConnectDBParams
				rClone := utils.CopyHttpRequest(r)
				err := httpx.Parse(rClone, &req)
				if err != nil {
					http.Error(w, err.Error(), http.StatusBadRequest)
					return
				}

				tokenString, clientInfo, err := parseConnectDBParams(&req, config)
				if err != nil {
					http.Error(w, err.Error(), http.StatusBadRequest)
					return
				}

				token := http.Cookie{
					Name:     "token",
					Value:    tokenString,
					Path:     "/",
					HttpOnly: true,
					MaxAge:   1800,
				}
				nsid := http.Cookie{
					Name:     "nsid",
					Value:    clientInfo.ClientID,
					Path:     "/",
					HttpOnly: true,
					MaxAge:   1800,
				}

				query := r.URL.Query()
				query.Set("nebulaVersion", string(clientInfo.NebulaVersion))
				r.URL, _ = r.URL.Parse(r.URL.Path + "?" + query.Encode())

				// w.Header().Set("Access-Control-Allow-Origin", "*")
				w.Header().Set("Set-Cookie", token.String())
				w.Header().Add("Set-Cookie", nsid.String())
			} else if strings.HasSuffix(r.URL.Path, "/disconnect") {
				nsidCookie, err := r.Cookie("nsid")

				if err == nil {
					query := r.URL.Query()
					query.Set("nsid", nsidCookie.Value)
					r.URL, _ = r.URL.Parse(r.URL.Path + "?" + query.Encode())
				}

				w.Header().Set("Set-Cookie", utils.DisabledCookie("token").String())
				w.Header().Add("Set-Cookie", utils.DisabledCookie("nsid").String())
			} else {
			}
			next(w, r)
		}
	}
}

func GenerateLoginToken(address string, port int, authorization string, config *config.Config) (string, error) {
	tokenSplit := strings.Split(authorization, " ")
	if len(tokenSplit) != 2 {
		return "", fmt.Errorf("invalid authorization")
	}

	decode, err := base64.StdEncoding.DecodeString(tokenSplit[1])
	if err != nil {
		return "", err
	}

	loginInfo := strings.Split(string(decode), ":")
	if len(loginInfo) < 2 {
		return "", fmt.Errorf("len of account is less than two")
	}

	username, password := loginInfo[0], loginInfo[1]
	clientInfo, err := dao.Connect(address, port, username, password)

	if err != nil {
		return "", err
	}

	return CreateToken(
		&AuthData{
			NebulaAddress: address,
			Username:      username,
			ClientID:      clientInfo.ClientID,
		},
		config,
	)
}

func (d *AuthData) Decode(tokenString, secret string) error {
	token, err := jwt.ParseWithClaims(tokenString, &authClaims{
		AuthData: d,
	}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return err
	}

	if _, ok := token.Claims.(*authClaims); !ok || !token.Valid {
		return fmt.Errorf("jwt parse not valid")
	}

	return nil
}
