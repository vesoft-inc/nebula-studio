package auth

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/gateway/dao"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/config"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
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
				fmt.Println("=====global middleware", r.URL.Path)
				var req types.ConnectDBParams
				err := httpx.Parse(r, &req)
				if err != nil {
					fmt.Println("=====req3333", req)
				}
				fmt.Println("=====err", err)
				fmt.Println("=====req.Address", req.Address)
				fmt.Println("=====req.Port", req.Port)
				fmt.Println("=====req.Authorization", req.Authorization)
			}
			c1 := http.Cookie{
				Name:     "access_token",
				Value:    "12333",
				Path:     "/",
				HttpOnly: true,
				MaxAge:   3600,
			}

			var req1 types.ConnectDBParams
			err1 := httpx.Parse(r, &req1)
			fmt.Println("=====err1=====", err1)

			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Set-Cookie", c1.String())
			next(w, r)
		}
	}
}

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// login handler
		if strings.HasSuffix(r.URL.Path, "/connect") {
			fmt.Println("=====global middleware", r.URL.Path)
		}
		c1 := http.Cookie{
			Name:     "access_token",
			Value:    "12333",
			Path:     "/",
			HttpOnly: true,
			MaxAge:   3600,
		}
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Set-Cookie", c1.String())
		next(w, r)
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
