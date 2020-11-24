package dao

import (
	"bytes"
	"errors"
	"fmt"
	"log"
	pool "nebula-go-api/service/pool"
	common "nebula-go-api/utils"
	"strconv"
	"strings"

	nebula "github.com/vesoft-inc/nebula-clients/go"
	nebulaType "github.com/vesoft-inc/nebula-clients/go/nebula"
)

type ExecuteResult struct {
	Headers  []string                `json:"headers"`
	Tables   []map[string]common.Any `json:"tables"`
	TimeCost int32                   `json:"timeCost"`
}

func getValue(value *nebulaType.Value) string {
	if value.IsSetNVal() { // null
		switch value.GetNVal() {
		case nebulaType.NullType___NULL__:
			return "NULL"
		case nebulaType.NullType_NaN:
			return "NaN"
		case nebulaType.NullType_BAD_DATA:
			return "BAD_DATA"
		case nebulaType.NullType_BAD_TYPE:
			return "BAD_TYPE"
		}
		return "NULL"
	} else if value.IsSetBVal() { // bool
		return strconv.FormatBool(value.GetBVal())
	} else if value.IsSetIVal() { // int64
		return strconv.FormatInt(value.GetIVal(), 10)
	} else if value.IsSetFVal() { // float64
		val := strconv.FormatFloat(value.GetFVal(), 'g', -1, 64)
		if !strings.Contains(val, ".") {
			idx := strings.LastIndex(val, "e")
			if idx == -1 {
				val += ".0"
			} else {
				val = val[0:idx] + ".0" + val[idx:]
			}
		}
		return val
	} else if value.IsSetSVal() { // string
		return string(value.GetSVal())
	} else if value.IsSetDVal() { // yyyy-mm-dd
		date := value.GetDVal()
		str := fmt.Sprintf("%d-%d-%d", date.GetYear(), date.GetMonth(), date.GetDay())
		return str
	} else if value.IsSetTVal() {
		time := value.GetTVal()
		str := fmt.Sprintf("%d:%d:%d:%d",
			time.GetHour(), time.GetMinute(), time.GetSec(), time.GetMicrosec())
		return str
	} else if value.IsSetDtVal() {
		datetime := value.GetDtVal()
		str := fmt.Sprintf("%d-%d-%d %d:%d:%d:%d",
			datetime.GetYear(), datetime.GetMonth(), datetime.GetDay(),
			datetime.GetHour(), datetime.GetMinute(), datetime.GetSec(), datetime.GetMicrosec())
		return str
	} else if value.IsSetVVal() { // Vertex
		var buffer bytes.Buffer
		vertex := value.GetVVal()
		buffer.WriteString(`("`)
		buffer.WriteString(string(vertex.GetVid()))
		buffer.WriteString(`")`)
		var tags []string
		for _, tag := range vertex.GetTags() {
			var props []string
			for k, v := range tag.GetProps() {
				props = append(props, fmt.Sprintf("%s: %s", k, getValue(v)))
			}
			tagName := string(tag.GetName())
			tagString := fmt.Sprintf(" :%s{%s}", tagName, strings.Join(props, ", "))
			tags = append(tags, tagString)
		}
		buffer.WriteString(strings.Join(tags, ","))
		return buffer.String()
	} else if value.IsSetEVal() { // Edge
		// (src)-[edge]->(dst)@ranking {props}
		edge := value.GetEVal()
		var buffer bytes.Buffer
		src := string(edge.GetSrc())
		dst := string(edge.GetDst())
		if edge.GetType() < 0 {
			src, dst = dst, src
		}
		var props []string
		for k, v := range edge.GetProps() {
			props = append(props, fmt.Sprintf("%s: %s", k, getValue(v)))
		}
		propsString := strings.Join(props, ", ")
		buffer.WriteString(fmt.Sprintf(`("%s")-[%s]->("%s")@%d{%s}`,
			src, edge.GetName(), dst, edge.GetRanking(), propsString))
		return buffer.String()
	} else if value.IsSetPVal() { // Path
		// (src)-[TypeName@ranking]->(dst)-[TypeName@ranking]->(dst) ...
		var buffer bytes.Buffer
		p := value.GetPVal()
		srcVid := string(p.GetSrc().GetVid())
		buffer.WriteString(fmt.Sprintf("(%q)", srcVid))
		for _, step := range p.GetSteps() {
			dstVid := string(step.GetDst().GetVid())
			buffer.WriteString(fmt.Sprintf("-[%s@%d]->(%q)", step.GetName(), step.GetRanking(), dstVid))
		}
		return buffer.String()
	} else if value.IsSetLVal() { // List
		l := value.GetLVal()
		var buffer bytes.Buffer
		buffer.WriteString("[")
		for _, v := range l.GetValues() {
			buffer.WriteString(getValue(v))
			buffer.WriteString(", ")
		}
		if buffer.Len() > 1 {
			buffer.Truncate(buffer.Len() - 2)
		}
		buffer.WriteString("]")
		return buffer.String()
	} else if value.IsSetMVal() { // Map
		m := value.GetMVal()
		var buffer bytes.Buffer
		buffer.WriteString("{")
		for k, v := range m.GetKvs() {
			buffer.WriteString("\"" + k + "\"")
			buffer.WriteString(":")
			buffer.WriteString(getValue(v))
			buffer.WriteString(", ")
		}
		if buffer.Len() > 1 {
			buffer.Truncate(buffer.Len() - 2)
		}
		buffer.WriteString("}")
		return buffer.String()
	} else if value.IsSetUVal() { // Set
		s := value.GetUVal()
		var buffer bytes.Buffer
		buffer.WriteString("{")
		for _, v := range s.GetValues() {
			buffer.WriteString(getValue(v))
			buffer.WriteString(", ")
		}
		if buffer.Len() > 1 {
			buffer.Truncate(buffer.Len() - 2)
		}
		buffer.WriteString("}")
		return buffer.String()
	}
	return ""
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
	if nebula.IsError(response.Result) {
		log.Printf("ErrorCode: %v, ErrorMsg: %s", resp.GetErrorCode(), resp.GetErrorMsg())
		return result, errors.New(string(resp.GetErrorMsg()))
	}
	if resp.GetData() != nil {
		columns := resp.GetData().GetColumnNames()
		for i := 0; i < len(columns); i++ {
			result.Headers = append(result.Headers, string(columns[i]))
		}

		rows := resp.GetData().GetRows()
		for _, row := range rows {
			var rowValue = make(map[string]common.Any)
			for index, column := range row.GetValues() {
				rowValue[result.Headers[index]] = getValue(column)
			}
			result.Tables = append(result.Tables, rowValue)
		}
	}
	result.TimeCost = resp.LatencyInUs

	return result, nil
}
