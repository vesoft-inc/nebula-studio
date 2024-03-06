package common

import (
	"fmt"
	"reflect"

	nebula "github.com/vesoft-inc/nebula-ng-tools/golang"
	types "github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/graph/types"
)

type dataParser struct{}

func (p *dataParser) callProxyMethod(method string, v nebula.Value) (any, error) {
	ok := isProxyMethod(method)
	if !ok {
		return nil, fmt.Errorf("unknown method: %s", method)
	}

	m := reflect.ValueOf(p).MethodByName(method)
	if !m.IsValid() {
		return nil, fmt.Errorf("invalid method: %s", method)
	}

	ret := m.Call([]reflect.Value{reflect.ValueOf(v)})
	if len(ret) != 2 {
		return nil, fmt.Errorf("method `%s` with invalid return value: %v", method, ret)
	}
	if ret[1].Interface() != nil {
		return nil, ret[1].Interface().(error)
	}
	return ret[0].Interface(), nil
}

func (p *dataParser) NULL(v nebula.Value) (any, error) {
	return nil, nil
}

func (p *dataParser) BOOL(v nebula.Value) (any, error) {
	val, err := v.AsBool()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) INT8(v nebula.Value) (any, error) {
	val, err := v.AsInt8()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) INT16(v nebula.Value) (any, error) {
	val, err := v.AsInt16()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) INT32(v nebula.Value) (any, error) {
	val, err := v.AsInt32()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) INT64(v nebula.Value) (any, error) {
	val, err := v.AsInt64()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) UINT8(v nebula.Value) (any, error) {
	val, err := v.AsUInt8()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) UINT16(v nebula.Value) (any, error) {
	val, err := v.AsUInt16()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) UINT32(v nebula.Value) (any, error) {
	val, err := v.AsUInt32()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) UINT64(v nebula.Value) (any, error) {
	val, err := v.AsUInt64()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) FLOAT(v nebula.Value) (any, error) {
	val, err := v.AsFloat()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) DOUBLE(v nebula.Value) (any, error) {
	val, err := v.AsDouble()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) STRING(v nebula.Value) (any, error) {
	val, err := v.AsString()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) LIST(v nebula.Value) (any, error) {
	val, err := v.AsList()
	if err != nil {
		return nil, err
	}
	list := make([]any, 0)
	for _, v := range val.GetValues() {
		propType := v.GetType().String()
		propVal, err := p.callProxyMethod(propType, v)
		if err != nil {
			return nil, err
		}
		list = append(list, propVal)
	}
	return list, nil
}

func (p *dataParser) RECORD(v nebula.Value) (any, error) {
	val, err := v.AsRecord()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) NODE(v nebula.Value) (any, error) {
	node, err := v.AsNode()
	if err != nil {
		return nil, err
	}
	// id := node.GetNodeId()
	props := node.GetProperties()
	parsedProps := make(map[string]any, 0)
	for k, v := range props {
		propType := v.GetType().String()
		propVal, err := p.callProxyMethod(propType, v)
		if err != nil {
			return nil, err
		}
		parsedProps[k] = propVal
	}
	result := types.ElementResult[types.NodeParsed]{
		Raw: node.String(),
		Value: types.NodeParsed{
			Properties: parsedProps,
		},
	}
	return result, nil
}

func (p *dataParser) EDGE(v nebula.Value) (any, error) {
	edge, err := v.AsEdge()
	if err != nil {
		return nil, err
	}
	// id := edge.GetEdgeId()
	// srcId := edge.GetSrcId()
	// dstId := edge.GetDstId()
	props := edge.GetProperties()
	parsedProps := make(map[string]any, 0)
	for k, v := range props {
		propType := v.GetType().String()
		propVal, err := p.callProxyMethod(propType, v)
		if err != nil {
			return nil, err
		}
		parsedProps[k] = propVal
	}
	result := types.ElementResult[types.EdgeParsed]{
		Raw: edge.String(),
		Value: types.EdgeParsed{
			Properties: parsedProps,
		},
	}
	return result, nil
}

func (p *dataParser) PATH(v nebula.Value) (any, error) {
	val, err := v.AsPath()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) DURATION(v nebula.Value) (any, error) {
	val, err := v.AsDuration()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) DATE(v nebula.Value) (any, error) {
	val, err := v.AsDate()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) LOCALTIME(v nebula.Value) (any, error) {
	val, err := v.AsLocalTime()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) LOCALDATETIME(v nebula.Value) (any, error) {
	val, err := v.AsLocalDatetime()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) ZONEDTIME(v nebula.Value) (any, error) {
	val, err := v.AsZonedTime()
	if err != nil {
		return nil, err
	}
	return val, nil
}

func (p *dataParser) ZONEDDATETIME(v nebula.Value) (any, error) {
	val, err := v.AsZonedDatetime()
	if err != nil {
		return nil, err
	}
	return val, nil
}

var DataParser = &dataParser{}

func Parser(v nebula.Result, r *types.ParsedResult) error {
	headers := v.Columns()
	if len(headers) == 0 {
		return nil
	}
	r.Headers = headers
	r.Latency = v.Latency()
	for v.HasNext() {
		row, err := v.Next()
		if err != nil {
			return err
		}
		values := row.Values()
		valMap := make(map[string]any, 0)
		for idx, v := range values {
			valueType := v.GetType().String()
			val, err := DataParser.callProxyMethod(valueType, v)
			if err != nil {
				return err
			}
			valMap[headers[idx]] = val
		}
		r.Tables = append(r.Tables, valMap)
	}
	return nil
}
