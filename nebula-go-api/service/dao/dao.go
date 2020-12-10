package dao

import (
	"errors"
	"log"
	pool "nebula-go-api/service/pool"
	common "nebula-go-api/utils"

	nebula "github.com/vesoft-inc/nebula-clients/go"
	nebulaType "github.com/vesoft-inc/nebula-clients/go/nebula"
)

type ExecuteResult struct {
	Headers  []string                `json:"headers"`
	Tables   []map[string]common.Any `json:"tables"`
	TimeCost int32                   `json:"timeCost"`
}

func getValue(valWarp *nebula.ValueWrapper) (common.Any, error) {
	var valType = valWarp.GetType()
	if valType == "vertex" {
		return valWarp.String(), nil
	} else if valType == "edge" {
		return valWarp.String(), nil
	} else if valType == "path" {
		return valWarp.String(), nil
	} else if valType == "list" {
		return valWarp.String(), nil
	} else if valType == "map" {
		return valWarp.String(), nil
	} else if valType == "set" {
		return valWarp.String(), nil
	} else {
		return getBasicValue(valWarp)
	}
}

func getBasicValue(valWarp *nebula.ValueWrapper) (common.Any, error) {
	var valType = valWarp.GetType()
	if valType == "null" {
		value, err := valWarp.AsNull()
		switch value {
		case nebulaType.NullType___NULL__:
			return "NULL", err
		case nebulaType.NullType_NaN:
			return "NaN", err
		case nebulaType.NullType_BAD_DATA:
			return "BAD_DATA", err
		case nebulaType.NullType_BAD_TYPE:
			return "BAD_TYPE", err
		}
		return "NULL", err
	} else if valType == "bool" {
		return valWarp.AsBool()
	} else if valType == "int" {
		return valWarp.AsInt()
	} else if valType == "float" {
		return valWarp.AsFloat()
	} else if valType == "string" {
		return valWarp.AsString()
	} else if valType == "date" {
		return valWarp.AsDate()
	} else if valType == "time" {
		return valWarp.AsTime()
	} else if valType == "datetime" {
		return valWarp.AsDateTime()
	}
	return "", nil
}

func getVertexInfo(valWarp *nebula.ValueWrapper, data map[string]common.Any) (map[string]common.Any, error) {
	node, err := valWarp.AsNode()
	if err != nil {
		return nil, err
	}
	id := node.GetID()
	data["vid"] = id
	tags := node.GetTags()
	data["tags"] = tags
	properties := make(map[string]map[string]common.Any)
	for _, tagName := range tags {
		props, err := node.Properties(tagName)
		if err != nil {
			return nil, err
		}
		_props := make(map[string]common.Any)
		for k, v := range props {
			value, err := getValue(v)
			if err != nil {
				return nil, err
			}
			_props[k] = value
		}
		properties[tagName] = _props
	}
	data["properties"] = properties
	return data, nil
}

func getEdgeInfo(valWarp *nebula.ValueWrapper, data map[string]common.Any) (map[string]common.Any, error) {
	relationship, err := valWarp.AsRelationship()
	if err != nil {
		return nil, err
	}
	srcID := relationship.GetSrcVertexID()
	data["srcID"] = srcID
	dstID := relationship.GetDstVertexID()
	data["dstID"] = dstID
	edgeName := relationship.GetEdgeName()
	data["edgeName"] = edgeName
	rank := relationship.GetRanking()
	data["rank"] = rank
	properties := make(map[string]common.Any)
	props := relationship.Properties()
	for k, v := range props {
		value, err := getValue(v)
		if err != nil {
			return nil, err
		}
		properties[k] = value
	}
	data["properties"] = properties
	return data, nil
}

func getPathInfo(valWarp *nebula.ValueWrapper, data map[string]common.Any) (map[string]common.Any, error) {
	path, err := valWarp.AsPath()
	if err != nil {
		return nil, err
	}
	relationships := path.GetRelationships()
	var _relationships []common.Any
	for _, relation := range relationships {
		_relation := make(map[string]common.Any)
		srcID := relation.GetSrcVertexID()
		_relation["srcID"] = srcID
		dstID := relation.GetDstVertexID()
		_relation["dstID"] = dstID
		edgeName := relation.GetEdgeName()
		_relation["edgeName"] = edgeName
		rank := relation.GetRanking()
		_relation["rank"] = rank
		_relationships = append(_relationships, _relation)
	}
	data["relationships"] = _relationships
	return data, nil
}

func getListInfo(valWarp *nebula.ValueWrapper, data []common.Any, listType string) ([]common.Any, error) {
	var valueList []nebula.ValueWrapper
	var err error
	if listType == "list" {
		valueList, err = valWarp.AsList()
	} else if listType == "set" {
		valueList, err = valWarp.AsDedupList()
	}
	if err != nil {
		return nil, err
	}
	for _, v := range valueList {
		var props = make(map[string]common.Any)
		vType := v.GetType()
		props["type"] = vType
		if vType == "vertex" {
			props, err = getVertexInfo(&v, props)
		} else if vType == "edge" {
			props, err = getEdgeInfo(&v, props)
		} else if vType == "list" {
			var items = make([]common.Any, 0)
			items, err = getListInfo(&v, items, "list")
			props["items"] = items
		} else if vType == "map" {
			var items = make(map[string]common.Any)
			items, err = getMapInfo(&v, items)
			props["items"] = items
		} else if vType == "set" {
			var items = make([]common.Any, 0)
			items, err = getListInfo(&v, items, "set")
			props["items"] = items
		} else {
			basicVal, err := getBasicValue(&v)
			if err != nil {
				return data, err
			}
			props["value"] = basicVal
		}
		data = append(data, props)
	}
	return data, nil
}

func getMapInfo(valWarp *nebula.ValueWrapper, data map[string]common.Any) (map[string]common.Any, error) {
	valueMap, err := valWarp.AsMap()
	if err != nil {
		return nil, err
	}
	for k, v := range valueMap {
		vType := v.GetType()
		if vType == "vertex" {
			var _props map[string]common.Any
			_props, err = getVertexInfo(&v, _props)
			data[k] = _props
		} else if vType == "edge" {
			var _props map[string]common.Any
			_props, err = getEdgeInfo(&v, _props)
			data[k] = _props
		} else if vType == "list" {
			var items = make([]common.Any, 0)
			items, err = getListInfo(&v, items, "list")
			data[k] = items
		} else if vType == "map" {
			var items = make(map[string]common.Any)
			items, err = getMapInfo(&v, items)
			data[k] = items
		} else if vType == "set" {
			var items = make([]common.Any, 0)
			items, err = getListInfo(&v, items, "set")
			data[k] = items
		} else {
			basicVal, err := getBasicValue(&v)
			if err != nil {
				return data, err
			}
			data[k] = basicVal
		}
	}
	return data, nil
}

// Connect return if the nebula connect succeed
func Connect(address string, port int, username string, password string) (nsid string, err error) {
	nsid, err = pool.NewConnection(address, port, username, password)
	if err != nil {
		return "", err
	}
	return nsid, err
}

func Disconnect(nsid string) {
	pool.Disconnect(nsid)
	return
}

func Execute(nsid string, gql string) (result ExecuteResult, err error) {
	result = ExecuteResult{
		Headers: make([]string, 0),
		Tables:  make([]map[string]common.Any, 0),
	}
	connection, err := pool.GetConnection(nsid)
	if err != nil {
		return result, err
	}

	responseChannel := make(chan pool.ChannelResponse)
	connection.RequestChannel <- pool.ChannelRequest{
		Gql:             gql,
		ResponseChannel: responseChannel,
	}
	response := <-responseChannel
	if response.Error != nil {
		return result, response.Error
	}
	resp := response.Result
	if !resp.IsSucceed() {
		log.Printf("ErrorCode: %v, ErrorMsg: %s", resp.GetErrorCode(), resp.GetErrorMsg())
		return result, errors.New(string(resp.GetErrorMsg()))
	}
	if !resp.IsEmpty() {
		rowSize, rowErr := resp.GetRowSize()
		colSize, colErr := resp.GetColSize()
		if rowErr != nil {
			return result, err
		}
		if colErr != nil {
			return result, err
		}
		colNames := resp.GetColNames()
		result.Headers = colNames
		for i := 0; i < rowSize; i++ {
			var rowValue = make(map[string]common.Any)
			record, err := resp.GetRowValuesByIndex(i)
			if err != nil {
				return result, err
			}
			for j := 0; j < colSize; j++ {
				rowData, err := record.GetValueByIndex(j)
				if err != nil {
					return result, err
				}
				value, err := getValue(rowData)
				if err != nil {
					return result, err
				}
				rowValue[result.Headers[j]] = value
				valueType := rowData.GetType()
				if valueType == "vertex" {
					rowValue, err = getVertexInfo(rowData, rowValue)
				} else if valueType == "edge" {
					rowValue, err = getEdgeInfo(rowData, rowValue)
				} else if valueType == "path" {
					rowValue, err = getPathInfo(rowData, rowValue)
				} else if valueType == "list" {
					var info []common.Any
					info, err = getListInfo(rowData, info, "list")
					rowValue[result.Headers[j]+"_info"] = info
				} else if valueType == "set" {
					var info []common.Any
					info, err = getListInfo(rowData, info, "set")
					rowValue[result.Headers[j]+"_info"] = info
				} else if valueType == "map" {
					var info = make(map[string]common.Any)
					info, err = getMapInfo(rowData, info)
					rowValue[result.Headers[j]+"_info"] = info
				}
				if err != nil {
					return result, err
				}
			}
			result.Tables = append(result.Tables, rowValue)
		}
	}
	result.TimeCost = resp.GetLatency()
	return result, nil
}
