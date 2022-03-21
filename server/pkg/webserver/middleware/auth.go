package middleware

import (
	"time"

	"github.com/iris-contrib/middleware/jwt"
	"github.com/kataras/iris/v12"
)

var (
	// TODO: Make it configurable
	mySecret     = []byte("login secret")
	WhiteListMap = map[string]struct{}{
		"POST/api-nebula/db/connect": {},
	}
)

func GetLoginToken(nebulaAddress string, username string) (string, error) {
	now := time.Now()
	token := jwt.NewTokenWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"nebulaAddress": nebulaAddress,
		"username":      username,
		"iat":           now.Unix(),
		"exp":           now.Add(24 * time.Hour).Unix(),
	})
	tokenString, err := token.SignedString(mySecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func AuthenticatedLoginHandler(ctx iris.Context) error {
	url := ctx.RouteName()
	//HACK: Whitelisted urls do not require JWT authentication
	if _, ok := WhiteListMap[url]; ok {
		ctx.Next()
		return nil
	}

	j := jwt.New(jwt.Config{
		ValidationKeyGetter: func(token *jwt.Token) (interface{}, error) {
			return mySecret, nil
		},
		Expiration: true,
		Extractor: func(ctx iris.Context) (string, error) {
			cookie, err := ctx.Request().Cookie("token")
			if err != nil {
				return "", err
			}
			return cookie.Value, nil
		},
		SigningMethod: jwt.SigningMethodHS256,
	})
	if err := j.CheckJWT(ctx); err != nil {
		return err
	}

	token := ctx.Values().Get("jwt").(*jwt.Token)

	userInfo := token.Claims.(jwt.MapClaims)
	for key, value := range userInfo {
		ctx.Values().Set(key, value)
	}
	ctx.Next()
	return nil
}
