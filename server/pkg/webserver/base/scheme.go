package base

import (
	"strings"

	"github.com/kataras/iris/v12"
	"github.com/kataras/iris/v12/context"
	"github.com/kataras/iris/v12/core/router"
	"go.uber.org/zap"
)

type Result interface{}

type Handler func(iris.Context) Result

type Method struct {
	Register func(path string, handlers ...context.Handler) *router.Route
	Handler  Handler
}

type Route struct {
	Path                   string
	MiddleWares            []iris.Handler
	GET, POST, PUT, DELETE Handler
	Desc                   string
	SubRoutes              []Route
}

type Response struct {
	Code    StatusCode  `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

func WrapHandler(handler Handler) iris.Handler {
	return func(ctx iris.Context) {
		result := handler(ctx)
		ctx.StatusCode(iris.StatusOK)
		if result != nil {
			_, _ = ctx.JSON(&result)
		}
	}
}

func SetRoute(r router.Party, route *Route) {
	routePath := route.Path
	hasSubRoutes := len(route.SubRoutes) > 0

	var middleWares []iris.Handler

	if !strings.HasPrefix(routePath, "/") {
		routePath = "/" + routePath
	}

	methods := []Method{
		{r.Get, route.GET},
		{r.Post, route.POST},
		{r.Put, route.PUT},
		{r.Delete, route.DELETE},
	}

	for _, method := range methods {
		if method.Handler != nil {
			zap.L().Info(r.GetRelPath())
			middleWares = append(middleWares, WrapHandler(method.Handler))
			_ = method.Register(routePath, middleWares...)
		}
	}

	if hasSubRoutes {
		pre := r.Party(routePath, middleWares...)
		for _, sub := range route.SubRoutes {
			sub := sub
			SetRoute(pre, &sub)
		}
	}
}
