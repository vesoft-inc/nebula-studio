package types

type ParsedResult struct {
	Headers []string         `json:"headers"`
	Tables  []map[string]any `json:"tables"`
	Latency int64            `json:"latency"` // in us
	/*
		{
			"buildTimeInUs": 194,
			"header": ["planNodes", "details"],
			"optimizeTimeInUs": 64,
			"planNodes": [
				{
					"children": [5],
					"columns": "graph_name",
					"details": "show_graphs() YIELD graph_name",
					"id": 4,
					"name": "CallProcedure"
				},
				{
					"columns": "",
					"details": "UNIT",
					"id": 5,
					"name": "Values"
				}
			],
			"preamble": "explain"
		}
	*/
	PlanDesc string `json:"planDesc"`
}
