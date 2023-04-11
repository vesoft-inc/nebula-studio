package client

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/facebook/fbthrift/thrift/lib/go/thrift"
	nebula "github.com/vesoft-inc/nebula-go/v3"
	nebulaType "github.com/vesoft-inc/nebula-go/v3/nebula"
	"github.com/zeromicro/go-zero/core/logx"
)

type ParsedResult struct {
	Headers     []string         `json:"headers"`
	Tables      []map[string]Any `json:"tables"`
	TimeCost    int64            `json:"timeCost"`
	LocalParams ParameterMap     `json:"localParams"`
}
type ExecuteResult struct {
	Gql    string
	Result ParsedResult
	Error  error
}

type Any interface{}

type list []Any

func isThriftProtoError(err error) bool {
	protoErr, ok := err.(thrift.ProtocolException)
	if !ok {
		return false
	}
	if protoErr.TypeID() != thrift.UNKNOWN_PROTOCOL_EXCEPTION {
		return false
	}
	errPrefix := []string{"wsasend", "wsarecv", "write:"}
	errStr := protoErr.Error()
	for _, e := range errPrefix {
		if strings.Contains(errStr, e) {
			return true
		}
	}
	return false
}

func isThriftTransportError(err error) bool {
	if transErr, ok := err.(thrift.TransportException); ok {
		typeId := transErr.TypeID()
		if typeId == thrift.UNKNOWN_TRANSPORT_EXCEPTION || typeId == thrift.TIMED_OUT {
			if strings.Contains(transErr.Error(), "read:") {
				return true
			}
		}
	}
	return false
}

func transformError(err error) error {
	if isThriftProtoError(err) || isThriftTransportError(err) {
		return ConnectionClosedError
	}
	return err
}

func getValue(valWarp *nebula.ValueWrapper) (Any, error) {
	switch valWarp.GetType() {
	case "vertex", "edge", "path", "list", "map", "set":
		return valWarp.String(), nil
	default:
		return getBasicValue(valWarp)
	}
}

func getBasicValue(valWarp *nebula.ValueWrapper) (Any, error) {
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
		case nebulaType.NullType_OUT_OF_RANGE:
			return "OUT_OF_RANGE", err
		case nebulaType.NullType_DIV_BY_ZERO:
			return "DIV_BY_ZERO", err
		case nebulaType.NullType_UNKNOWN_PROP:
			return "UNKNOWN_PROP", err
		case nebulaType.NullType_ERR_OVERFLOW:
			return "ERR_OVERFLOW", err
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
		return valWarp.String(), nil
	} else if valType == "time" {
		return valWarp.String(), nil
	} else if valType == "datetime" {
		return valWarp.String(), nil
	} else if valType == "geography" {
		return valWarp.String(), nil
	} else if valType == "duration" {
		return valWarp.String(), nil
	} else if valType == "empty" {
		return "_EMPTY_", nil
	}
	return "", nil
}
func getID(idWarp nebula.ValueWrapper) Any {
	idType := idWarp.GetType()
	var vid Any
	if idType == "string" {
		vid, _ = idWarp.AsString()
	} else if idType == "int" {
		vid, _ = idWarp.AsInt()
	}
	return vid
}

func getVertexInfo(valWarp *nebula.ValueWrapper, data map[string]Any) (map[string]Any, error) {
	node, err := valWarp.AsNode()
	if err != nil {
		return nil, err
	}
	id := node.GetID()
	data["vid"] = getID(id)
	tags := make([]string, 0)
	properties := make(map[string]map[string]Any)
	for _, tagName := range node.GetTags() {
		tags = append(tags, tagName)
		props, err := node.Properties(tagName)
		if err != nil {
			return nil, err
		}
		_props := make(map[string]Any)
		for k, v := range props {
			value, err := getValue(v)
			if err != nil {
				return nil, err
			}
			_props[k] = value
		}
		properties[tagName] = _props
	}
	data["tags"] = tags
	data["properties"] = properties
	return data, nil
}

func getEdgeInfo(valWarp *nebula.ValueWrapper, data map[string]Any) (map[string]Any, error) {
	relationship, err := valWarp.AsRelationship()
	if err != nil {
		return nil, err
	}
	srcID := relationship.GetSrcVertexID()
	data["srcID"] = getID(srcID)
	dstID := relationship.GetDstVertexID()
	data["dstID"] = getID(dstID)
	edgeName := relationship.GetEdgeName()
	data["edgeName"] = edgeName
	rank := relationship.GetRanking()
	data["rank"] = rank
	properties := make(map[string]Any)
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

func getPathInfo(valWarp *nebula.ValueWrapper, data map[string]Any) (map[string]Any, error) {
	path, err := valWarp.AsPath()
	if err != nil {
		return nil, err
	}
	relationships := path.GetRelationships()
	var _relationships []Any
	for _, relation := range relationships {
		_relation := make(map[string]Any)
		srcID := relation.GetSrcVertexID()
		_relation["srcID"] = getID(srcID)
		dstID := relation.GetDstVertexID()
		_relation["dstID"] = getID(dstID)
		edgeName := relation.GetEdgeName()
		_relation["edgeName"] = edgeName
		rank := relation.GetRanking()
		_relation["rank"] = rank
		_relationships = append(_relationships, _relation)
	}
	data["relationships"] = _relationships
	if len(relationships) == 0 {
		nodes := path.GetNodes()
		if len(nodes) > 0 {
			startNode := nodes[0]
			data["srcID"] = getID(startNode.GetID())
		}
	}
	return data, nil
}

func getListInfo(valWarp *nebula.ValueWrapper, listType string, _verticesParsedList *list, _edgesParsedList *list, _pathsParsedList *list) error {
	var valueList []nebula.ValueWrapper
	var err error
	if listType == "list" {
		valueList, err = valWarp.AsList()
	} else if listType == "set" {
		valueList, err = valWarp.AsDedupList()
	}
	if err != nil {
		return err
	}
	for _, v := range valueList {
		var props = make(map[string]Any)
		vType := v.GetType()
		props["type"] = vType
		if vType == "vertex" {
			props, err = getVertexInfo(&v, props)
			if err == nil {
				*_verticesParsedList = append(*_verticesParsedList, props)
			} else {
				return err
			}
		} else if vType == "edge" {
			props, err = getEdgeInfo(&v, props)
			if err == nil {
				*_edgesParsedList = append(*_edgesParsedList, props)
			} else {
				return err
			}
		} else if vType == "path" {
			props, err = getPathInfo(&v, props)
			if err == nil {
				*_pathsParsedList = append(*_pathsParsedList, props)
			} else {
				return err
			}
		} else if vType == "list" {
			err = getListInfo(&v, "list", _verticesParsedList, _edgesParsedList, _pathsParsedList)
			if err != nil {
				return err
			}
		} else if vType == "map" {
			err = getMapInfo(&v, _verticesParsedList, _edgesParsedList, _pathsParsedList)
			if err != nil {
				return err
			}
		} else if vType == "set" {
			err = getListInfo(&v, "set", _verticesParsedList, _edgesParsedList, _pathsParsedList)
			if err != nil {
				return err
			}
		} else {
			// no need to parse basic value now
		}
	}
	return nil
}

func getMapInfo(valWarp *nebula.ValueWrapper, _verticesParsedList *list, _edgesParsedList *list, _pathsParsedList *list) error {
	valueMap, err := valWarp.AsMap()
	if err != nil {
		return err
	}
	for _, v := range valueMap {
		vType := v.GetType()
		if vType == "vertex" {
			_props := make(map[string]Any)
			_props, err = getVertexInfo(&v, _props)
			if err == nil {
				*_verticesParsedList = append(*_verticesParsedList, _props)
			} else {
				return err
			}
		} else if vType == "edge" {
			_props := make(map[string]Any)
			_props, err = getEdgeInfo(&v, _props)
			if err == nil {
				*_edgesParsedList = append(*_edgesParsedList, _props)
			} else {
				return err
			}
		} else if vType == "path" {
			_props := make(map[string]Any)
			_props, err = getPathInfo(&v, _props)
			if err == nil {
				*_pathsParsedList = append(*_pathsParsedList, _props)
			} else {
				return err
			}
		} else if vType == "list" {
			err = getListInfo(&v, "list", _verticesParsedList, _edgesParsedList, _pathsParsedList)
			if err != nil {
				return err
			}
		} else if vType == "map" {
			err = getMapInfo(&v, _verticesParsedList, _edgesParsedList, _pathsParsedList)
			if err != nil {
				return err
			}
		} else if vType == "set" {
			err = getListInfo(&v, "set", _verticesParsedList, _edgesParsedList, _pathsParsedList)
			if err != nil {
				return err
			}
		} else {
			// no need to parse basic value now
		}
	}
	return nil
}

func (client *Client) handleRequest(nsid string) {
	for {
		select {
		case request := <-client.RequestChannel:
			go func() {
				defer func() {
					if err := recover(); err != nil {
						logx.Errorf("[handle request]: &s, %+v", request.Gqls, err)
						request.ResponseChannel <- ChannelResponse{
							Results: nil,
							Msg:     err,
							Error:   SessionLostError,
						}
					}
				}()

				for {
					var err error
					session, err := client.getSession()
					if err != nil {
						request.ResponseChannel <- ChannelResponse{
							Results: nil,
							Error:   err,
						}
						return
					}
					if session == nil {
						// session create failed, bug still has active session, so wait for a while
						time.Sleep(time.Millisecond * 500)
						continue
					}
					defer client.sessionPool.addSession(session)
					client.executeRequest(session, request)
					break
				}
			}()
		case <-client.CloseChannel:
			client.sessionPool.clearSessions()
			client.graphClient.Close()
			clientPool.Delete(nsid)
			return // Exit loop
		}
	}
}

func (client *Client) executeRequest(session *nebula.Session, request ChannelRequest) {
	parameterMap := client.parameterMap
	result := make([]SingleResponse, 0)
	// add use space before execute
	if request.Space != "" {
		space := strings.Replace(request.Space, "\\", "\\\\", -1)
		space = strings.Replace(space, "`", "\\`", -1)
		gql := fmt.Sprintf("USE `%s`;", space)
		_, err := session.ExecuteWithParameter(gql, parameterMap)
		if err != nil {
			request.ResponseChannel <- ChannelResponse{
				Results: nil,
				Error:   transformError(err),
			}
			return
		}
	}

	for _, gql := range request.Gqls {
		isLocal, cmd, args := isClientCmd(gql)
		if isLocal {
			showMap, err := executeClientCmd(cmd, args, parameterMap)
			if err != nil {
				result = append(result, SingleResponse{
					Gql:    gql,
					Error:  err,
					Result: nil,
				})
			} else if cmd != 3 {
				// sleep dont need to return result
				result = append(result, SingleResponse{
					Error:  nil,
					Result: nil,
					Params: showMap,
					Gql:    gql,
				})
			}
		} else {
			execResponse, err := session.ExecuteWithParameter(gql, parameterMap)
			if err != nil {
				result = append(result, SingleResponse{
					Gql:    gql,
					Error:  transformError(err),
					Result: nil,
				})
			} else {
				result = append(result, SingleResponse{
					Gql:    gql,
					Error:  nil,
					Result: execResponse,
				})
			}
		}
	}

	request.ResponseChannel <- ChannelResponse{
		Results: result,
		Error:   nil,
	}
}

func Execute(nsid string, space string, gqls []string) ([]ExecuteResult, error) {
	client, _ := clientPool.Get(nsid)
	responseChannel := make(chan ChannelResponse)
	client.RequestChannel <- ChannelRequest{
		Gqls:            gqls,
		Space:           space,
		ResponseChannel: responseChannel,
	}
	response := <-responseChannel

	res := make([]ExecuteResult, 0)
	if response.Error != nil {
		return nil, response.Error
	}

	results := response.Results
	for _, resp := range results {
		result, err := parseExecuteData(resp)
		res = append(res, ExecuteResult{
			Gql:    resp.Gql,
			Result: result,
			Error:  err,
		})
	}
	return res, nil
}

func parseExecuteData(response SingleResponse) (ParsedResult, error) {
	result := ParsedResult{
		Headers:     make([]string, 0),
		Tables:      make([]map[string]Any, 0),
		LocalParams: nil,
	}
	if len(response.Params) > 0 {
		result.LocalParams = response.Params
	}

	if response.Error != nil {
		return result, response.Error
	}
	res := response.Result
	if response.Result == nil {
		return result, nil
	}

	if !res.IsSucceed() {
		return result, errors.New(res.GetErrorMsg())
	}
	if res.IsSetPlanDesc() {
		resp := response.Result
		if response.Result == nil {
			return result, nil
		}
		format := string(resp.GetPlanDesc().GetFormat())
		if format == "row" {
			result.Headers = []string{"id", "name", "dependencies", "profiling data", "operator info"}
			rows := res.MakePlanByRow()
			for i := 0; i < len(rows); i++ {
				var rowValue = make(map[string]Any)
				rowValue["id"] = rows[i][0]
				rowValue["name"] = rows[i][1]
				rowValue["dependencies"] = rows[i][2]
				rowValue["profiling data"] = rows[i][3]
				rowValue["operator info"] = rows[i][4]
				result.Tables = append(result.Tables, rowValue)
			}
			return result, nil
		} else {
			var rowValue = make(map[string]Any)
			result.Headers = append(result.Headers, "format")
			if format == "dot" {
				rowValue["format"] = res.MakeDotGraph()
			} else if format == "dot:struct" {
				rowValue["format"] = res.MakeDotGraphByStruct()
			}
			result.Tables = append(result.Tables, rowValue)
			return result, nil
		}
	}
	if !res.IsEmpty() {
		rows := res.GetRows()
		rowSize := len(rows)
		colSize := res.GetColSize()
		colNames := res.GetColNames()
		result.Headers = colNames

		for i := 0; i < rowSize; i++ {
			var rowValue = make(map[string]Any)
			var _verticesParsedList = make(list, 0)
			var _edgesParsedList = make(list, 0)
			var _pathsParsedList = make(list, 0)

			for j := 0; j < colSize; j++ {
				record, err := res.GetRowValuesByIndex(i)
				if err != nil {
					return result, err
				}
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
					var parseValue = make(map[string]Any)
					parseValue, err = getVertexInfo(rowData, parseValue)
					parseValue["type"] = "vertex"
					_verticesParsedList = append(_verticesParsedList, parseValue)
				} else if valueType == "edge" {
					var parseValue = make(map[string]Any)
					parseValue, err = getEdgeInfo(rowData, parseValue)
					parseValue["type"] = "edge"
					_edgesParsedList = append(_edgesParsedList, parseValue)
				} else if valueType == "path" {
					var parseValue = make(map[string]Any)
					parseValue, err = getPathInfo(rowData, parseValue)
					parseValue["type"] = "path"
					_pathsParsedList = append(_pathsParsedList, parseValue)
				} else if valueType == "list" {
					err = getListInfo(rowData, "list", &_verticesParsedList, &_edgesParsedList, &_pathsParsedList)
				} else if valueType == "set" {
					err = getListInfo(rowData, "set", &_verticesParsedList, &_edgesParsedList, &_pathsParsedList)
				} else if valueType == "map" {
					err = getMapInfo(rowData, &_verticesParsedList, &_edgesParsedList, &_pathsParsedList)
				}
				if len(_verticesParsedList) > 0 {
					rowValue["_verticesParsedList"] = _verticesParsedList
				}
				if len(_edgesParsedList) > 0 {
					rowValue["_edgesParsedList"] = _edgesParsedList
				}
				if len(_pathsParsedList) > 0 {
					rowValue["_pathsParsedList"] = _pathsParsedList
				}
				if err != nil {
					return result, err
				}
			}
			result.Tables = append(result.Tables, rowValue)
		}
	}
	result.TimeCost = res.GetLatency()
	return result, nil
}

func GetClusters(nsid string) ([]string, error) {
	ipRegex := regexp.MustCompile(`^(\d{1,3}\.){3}\d{1,3}$`)
	executes, err := Execute(nsid, "", []string{"show hosts graph;"})
	if err != nil {
		return nil, err
	}
	res := executes[0]
	if res.Error != nil {
		return nil, nil
	}
	var clusters []string
	for _, item := range res.Result.Tables {
		host := item["Host"]
		port := item["Port"]
		if ipRegex.MatchString(host.(string)) {
			address := fmt.Sprintf("%s:%d", host, port)
			clusters = append(clusters, address)
		}
	}
	return clusters, nil
}
