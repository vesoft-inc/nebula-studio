package graphd

import (
	nebula "github.com/vesoft-inc/nebula-ng-tools/golang"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/graphd/resultparser"
	types "github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/graphd/types"
	"github.com/zeromicro/go-zero/core/logx"
)

func RunGql(client nebula.Conn, query string) (*types.ParsedResult, error) {
	resp, err := client.Execute(query)
	if err != nil {
		logx.Error("Query execution failed: " + err.Error())
		return nil, err
	}

	result := types.ParsedResult{
		Headers: make([]string, 0),
		Tables:  make([]map[string]any, 0),
	}

	err = resultparser.Parser(resp, &result)
	if err != nil {
		logx.Error("Result parsing failed: " + err.Error())
		return nil, err
	}

	return &result, nil
}
