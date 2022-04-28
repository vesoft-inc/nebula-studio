package middleware

import (
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/zeromicro/go-zero/core/logx"
)

type (
	CtxKeyUserInfo struct{}

	AuthData struct {
		NebulaAddress string `json:"nebulaAddress"`
		Username      string `json:"username"`
	}

	authClaims struct {
		*AuthData
		jwt.StandardClaims
	}
)

func CreateToken(nebulaAddress string, username string) (string, error) {
	now := time.Now()

}

func Auth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logx.Info("global middleware", r.URL.Path)
		next(w, r)
	}
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

func (d *AuthData) Encode(secretKey string, expiresAt int64) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256,
		authClaims{
			AuthData: d,
			StandardClaims: jwt.StandardClaims{
				ExpiresAt: expiresAt,
			},
		})

	return token.SignedString([]byte(secretKey))
}
