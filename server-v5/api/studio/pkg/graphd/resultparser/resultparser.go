package resultparser

import (
	nebula "github.com/vesoft-inc/nebula-ng-tools/golang"
	common "github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/graphd/resultparser/common"
	explain "github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/graphd/resultparser/explain"
	types "github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/graphd/types"
)

var parserList = [](func(v nebula.Result, r *types.ParsedResult) error){
	common.Parser,
	explain.Parser,
}

func Parser(v nebula.Result, r *types.ParsedResult) error {
	for _, parser := range parserList {
		err := parser(v, r)
		if err != nil {
			return err
		}
	}
	return nil
}
