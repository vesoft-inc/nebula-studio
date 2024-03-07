package explain

import (
	nebula "github.com/vesoft-inc/nebula-ng-tools/golang"
	types "github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/graphd/types"
)

func Parser(v nebula.Result, r *types.ParsedResult) error {
	planDesce := v.PlanDesc()
	if planDesce == nil {
		return nil
	}

	r.PlanDesc = string(planDesce)
	return nil
}
