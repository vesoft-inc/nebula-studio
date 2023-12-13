package llm

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	nebula_go "github.com/vesoft-inc/nebula-go/v3"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/config"
	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/base"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/client"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/pdf"
	"gorm.io/datatypes"
)

type Field struct {
	Name     string `json:"name"`
	DataType string `json:"dataType"`
	Nullable bool   `json:"nullable"`
}
type NodeType struct {
	Type  string  `json:"type"`
	Props []Field `json:"props"`
}
type EdgeType struct {
	Type  string  `json:"type"`
	Props []Field `json:"props"`
}
type Schema struct {
	Space     string     `json:"spaceName"`
	VidType   string     `json:"vidType"`
	NodeTypes []NodeType `json:"nodeTypes"`
	EdgeTypes []EdgeType `json:"edgeTypes"`
}
type ImportJob struct {
	CacheNodes map[string]Node
	CacheEdges map[string]map[string]Edge
	Prompt     string
	LLMJob     *db.LLMJob     `json:"llmJob"`
	LLMConfig  *db.LLMConfig  `json:"llmConfig"`
	AuthData   *auth.AuthData `json:"authData"`
	NSID       string
	Process    *base.Process
	logFile    *os.File
	Schema     Schema
	SchemaMap  map[string]map[string]Field
}

func RunFileJob(job *db.LLMJob) {
	llmJob := ImportJob{
		CacheNodes: make(map[string]Node),
		CacheEdges: make(map[string]map[string]Edge),
		LLMJob:     job,
		Process: &base.Process{
			TotalSize:        0,
			CurrentSize:      0,
			Ratio:            0,
			PromptTokens:     0,
			CompletionTokens: 0,
		},
	}
	err := llmJob.AddLogFile()
	if err != nil {
		llmJob.SetJobFailed(err)
		return
	}
	defer llmJob.CloseLogFile()
	defer func() {
		if err := recover(); err != nil {
			llmJob.WriteLogFile(fmt.Sprintf("panic: %v", err), "error")
			llmJob.SetJobFailed(err)
		}
		processJson, err := json.Marshal(llmJob.Process)
		if err != nil {
			llmJob.WriteLogFile(fmt.Sprintf("marshal process error: %v", err), "error")
		}
		err = db.CtxDB.Model(&job).Where("job_id = ?", job.JobID).Updates(map[string]interface{}{
			"process": datatypes.JSON(processJson),
			"status":  job.Status,
		}).Error
		if err != nil {
			llmJob.WriteLogFile(fmt.Sprintf("update process error: %v", err), "error")
			return
		}
	}()
	go llmJob.SyncProcess(job)

	llmJob.Process.Ratio = 0.01
	err = llmJob.ParseSchema(job.SpaceSchemaString)
	if err != nil {
		llmJob.WriteLogFile(fmt.Sprintf("parse schema error: %v", err), "error")
		llmJob.SetJobFailed(err)
		return
	}

	llmConfig := db.LLMConfig{
		Host:     job.Host,
		UserName: job.UserName,
	}
	err = db.CtxDB.Where(llmConfig).First(&llmConfig).Error
	if err != nil {
		llmJob.WriteLogFile(fmt.Sprintf("get llm config error: %v", err), "error")
		llmJob.SetJobFailed(err)
		return
	}
	llmJob.LLMConfig = &llmConfig
	llmJob.Process.Ratio = 0.03

	connectInfo, ok := auth.CtxUserInfoMap[fmt.Sprintf("%s:%s", job.Host, job.UserName)]
	if !ok {
		err := fmt.Errorf("get connect info error: %s", job.Host+" "+job.UserName)
		llmJob.WriteLogFile(err.Error(), "error")
		llmJob.SetJobFailed(err)
		return
	}
	llmJob.AuthData = &connectInfo
	clientInfo, err := client.NewClient(connectInfo.Address, connectInfo.Port, connectInfo.Username, connectInfo.Password, nebula_go.GetDefaultConf())
	if err != nil {
		llmJob.WriteLogFile(fmt.Sprintf("create client error: %v", err), "error")
		return
	}
	llmJob.NSID = clientInfo.ClientID
	llmJob.Process.Ratio = 0.05

	llmJob.WriteLogFile(fmt.Sprintf("start run file job, file path: %s", job.File), "info")

	filePath := path.Join(config.GetConfig().File.UploadDir, llmJob.LLMJob.File)
	text, err := llmJob.ReadFile(filePath)
	if err != nil {
		llmJob.WriteLogFile(fmt.Sprintf("read file error: %v", err), "error")
		llmJob.SetJobFailed(err)
		return
	}
	blocks, err := llmJob.SplitText(text)
	if err != nil {
		llmJob.WriteLogFile(fmt.Sprintf("split text error: %v", err), "error")
		llmJob.SetJobFailed(err)
		return
	}
	llmJob.Process.Ratio = 0.07
	err = llmJob.QueryBlocks(blocks)
	if err != nil {
		llmJob.WriteLogFile(fmt.Sprintf("query blocks error: %v", err), "error")
		llmJob.SetJobFailed(err)
		return
	}
	llmJob.Process.Ratio = 0.8

	gqlPath := filepath.Join(config.GetConfig().LLM.GQLPath, fmt.Sprintf("%s/%s.ngql", llmJob.LLMJob.JobID, llmJob.LLMJob.File))
	gqls, err := llmJob.MakeGQLFile(gqlPath)
	if err != nil {
		llmJob.WriteLogFile(fmt.Sprintf("make gql file error: %v", err), "error")
		llmJob.SetJobFailed(err)
		return
	}
	if IsRunningJobStopped(job.JobID) {
		return
	}
	llmJob.Process.Ratio = 0.9

	llmJob.RunGQLFile(gqls)
	llmJob.Process.Ratio = 1
	llmJob.LLMJob.Status = base.LLMStatusSuccess
}

func (i *ImportJob) SyncProcess(job *db.LLMJob) {
	for {
		// stop
		if job.Status != base.LLMStatusRunning {
			return
		}
		jsonStr, err := json.Marshal(i.Process)
		if err != nil {
			i.WriteLogFile(fmt.Sprintf("marshal process error: %v", err), "error")
			continue
		}
		job.Process = datatypes.JSON(jsonStr)
		time.Sleep(time.Second)
	}
}

func (i *ImportJob) SetJobFailed(failedErr any) {
	i.LLMJob.Status = base.LLMStatusFailed
	i.Process.FailedReason = fmt.Sprintf("%v", failedErr)
}

func (i *ImportJob) AddLogFile() error {
	// mkdir
	err := os.MkdirAll(filepath.Join(config.GetConfig().LLM.GQLPath, i.LLMJob.JobID), 0755)
	if err != nil {
		return err
	}
	logFile := filepath.Join(config.GetConfig().LLM.GQLPath, fmt.Sprintf("%s/all.log", i.LLMJob.JobID))
	file, err := os.OpenFile(logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	i.logFile = file
	i.WriteLogFile(fmt.Sprintf("add log file success, file path: %s", logFile), "info")
	i.WriteLogFile(fmt.Sprintf("now task info: \n%v\n config:%v", i.LLMJob, i.LLMConfig), "info")
	return nil
}

func (i *ImportJob) CloseLogFile() {
	if i.logFile != nil {
		i.logFile.Close()
	}
}

func (i *ImportJob) WriteLogFile(str string, typ string) {
	if i.logFile != nil {
		i.logFile.WriteString(fmt.Sprintf("%s[%s] %s\n", time.Now().Format("2006-01-02 15:04:05"), typ, str))
	}
	log.Println(fmt.Sprintf("[%s]", typ), str)
}

func (i *ImportJob) ReadFile(filePath string) (string, error) {
	if filePath == "" {
		return "", fmt.Errorf("file path is empty")
	}

	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("open file error: %v", err)
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		return "", fmt.Errorf("get file stat error: %v", err)
	}
	size := stat.Size()
	i.Process.TotalSize = int(size)

	if strings.HasSuffix(filePath, ".pdf") {
		file.Close()
		return pdf.ReadPDFFile(filePath)
	}
	bytes, err := io.ReadAll(file)
	if err != nil {
		return "", fmt.Errorf("read file error: %v", err)
	}
	i.WriteLogFile(fmt.Sprintf("read file success, file path: %s", filePath), "info")
	return string(bytes), nil
}

func (i *ImportJob) SplitText(str string) (blocks []string, err error) {
	// split text to each blocks for llm context length limit
	blocks = make([]string, 0)
	lines := strings.Split(str, "\n")
	block := ""
	for _, line := range lines {
		if line == "\n" {
			continue
		}
		if len(block)+len(line)+len(i.Prompt) > i.LLMConfig.ContextLengthLimit {
			blocks = append(blocks, block)
			block = ""
		}
		block += line + "\n"
	}
	if block != "" {
		blocks = append(blocks, block)
	}
	i.WriteLogFile(fmt.Sprintf("split text success, blocks length: %d", len(blocks)), "info")

	return blocks, nil
}

func (i *ImportJob) ParseSchema(text string) error {
	schema := Schema{}
	err := json.Unmarshal([]byte(text), &schema)
	if err != nil {
		return err
	}
	i.Schema = schema
	return i.GetSchemaMap()
}

func (i *ImportJob) GetSchemaMap() error {
	schema := i.Schema
	i.SchemaMap = make(map[string]map[string]Field)
	nodeSchemaString := ""
	edgeSchemaString := ""
	for _, tag := range schema.NodeTypes {
		nodeSchemaString += fmt.Sprintf("NodeType \"%s\" {", tag.Type)
		i.SchemaMap[tag.Type] = make(map[string]Field)
		for _, field := range tag.Props {
			i.SchemaMap[tag.Type][field.Name] = field
			nodeSchemaString += fmt.Sprintf("\"%s\":%s ", field.Name, field.DataType)
		}
		nodeSchemaString += "}\n"
	}
	for _, edge := range schema.EdgeTypes {
		edgeSchemaString += fmt.Sprintf("EdgeType \"%s\" { ", edge.Type)
		i.SchemaMap[edge.Type] = make(map[string]Field)
		for _, field := range edge.Props {
			i.SchemaMap[edge.Type][field.Name] = field
			edgeSchemaString += fmt.Sprintf("\"%s\":%s ", field.Name, field.DataType)
		}
		edgeSchemaString += "}\n"
	}
	i.LLMJob.SpaceSchemaString = nodeSchemaString + edgeSchemaString
	return nil
}

type LLMResult struct {
	Nodes []Node `json:"nodes"`
	Edges []Edge `json:"edges"`
}
type Node struct {
	Name  string         `json:"name"`
	Type  string         `json:"type"`
	Props map[string]any `json:"props"`
}

type Edge struct {
	Src      string         `json:"src"`
	Dst      string         `json:"dst"`
	EdgeType string         `json:"edgeType"`
	Props    map[string]any `json:"props"`
}

func (i *ImportJob) ParseText(text string) {
	// remove ```json and ``` in text
	text = strings.ReplaceAll(text, "```json", "")
	text = strings.ReplaceAll(text, "```", "")
	text = strings.ReplaceAll(text, "\n", "")

	jsonObj := LLMResult{}
	err := json.Unmarshal([]byte(text), &jsonObj)
	if err != nil {
		i.WriteLogFile(fmt.Sprintf("parse text error: %v, str:%s", err, text), "error")
		return
	}
	for _, node := range jsonObj.Nodes {
		nowNode, ok := i.CacheNodes[node.Name]
		if !ok {
			i.CacheNodes[node.Name] = node
			continue
		}
		for key, value := range node.Props {
			nowNode.Props[key] = value
		}
	}
	for _, edge := range jsonObj.Edges {
		src := edge.Dst
		dst := edge.Src
		if src != "" && dst != "" {
			if _, ok := i.CacheEdges[src]; !ok {
				i.CacheEdges[src] = make(map[string]Edge)
			}
			nowEdge, ok := i.CacheEdges[src][dst]
			if !ok {
				i.CacheEdges[src][dst] = edge
				continue
			}
			for key, value := range edge.Props {
				nowEdge.Props[key] = value
			}
		}
	}
}

// todo: get space schema
func (i *ImportJob) GetPrompt(text string) string {
	i.Prompt = strings.ReplaceAll(i.LLMJob.PromptTemplate, "{spaceSchema}", i.LLMJob.SpaceSchemaString)
	i.Prompt = strings.ReplaceAll(i.Prompt, "{text}", text)
	return i.Prompt
}

func (i *ImportJob) QueryBlocks(blocks []string) error {
	job := i.LLMJob
	maxBlocks := config.GetConfig().LLM.MaxBlockSize
	for index, block := range blocks {
		if index >= maxBlocks {
			break
		}
		if IsRunningJobStopped(job.JobID) {
			return nil
		}
		prompt := i.GetPrompt(block)
		text, err := i.Query(prompt)
		if err != nil {
			i.WriteLogFile(fmt.Sprintf("query error: %v", err), "error")
			continue
		}
		i.ParseText(text)
		// update process
		ratio := float64(index+1) / float64(len(blocks))
		i.Process.Ratio = 0.1 + ratio*0.6
		i.Process.CurrentSize = int((ratio * float64(i.Process.TotalSize)))
	}
	return nil
}

func (i *ImportJob) Query(prompt string) (string, error) {
	i.WriteLogFile(fmt.Sprintf("start query, prompt: %s", prompt), "info")
	messages := make([]map[string]any, 0)
	messages = append(messages, map[string]any{
		"role":    "user",
		"content": prompt,
	})
	res, err := FetchWithLLMConfig(i.LLMConfig, map[string]any{
		"stream":     false,
		"messages":   messages,
		"max_tokens": i.LLMConfig.ContextLengthLimit,
	}, func(str string) {})
	if err != nil {
		return "", err
	}
	i.WriteLogFile(fmt.Sprintf("query success, res: %v", res), "info")
	text := res["choices"].([]any)[0].(map[string]any)["message"].(map[string]any)["content"].(string)
	i.Process.PromptTokens += int(res["usage"].(map[string]any)["prompt_tokens"].(float64))
	i.Process.CompletionTokens += int(res["usage"].(map[string]any)["completion_tokens"].(float64))
	return text, nil
}

func (i *ImportJob) MakeGQLFile(filePath string) ([]string, error) {
	i.WriteLogFile(fmt.Sprintf("start make gql file, nodes length: %d, edges length: %d", len(i.CacheNodes), len(i.CacheEdges)), "info")
	gqls := make([]string, 0)
	spaceVIDType := i.Schema.VidType
	// if spaceVIDType == "FIXED_STRING(32)" {
	regex := regexp.MustCompile(`\((\d+)\)`)
	match := regex.FindStringSubmatch(spaceVIDType)
	vidLength := 128
	if len(match) > 1 {
		len, err := strconv.Atoi(match[1])
		if err == nil {
			vidLength = len
		}
	}
	isVidString := strings.Contains(spaceVIDType, "STRING")
	for _, v := range i.CacheNodes {
		typ := v.Type
		name := v.Name
		if isVidString {
			if len(name) > vidLength {
				name = name[:vidLength]
			}
		}

		typeSchema, ok := i.SchemaMap[typ]
		if !ok {
			continue
		}
		props := v.Props
		propsStr := ""
		valueStr := ""

		for key, field := range typeSchema {
			value, ok := props[key]
			if !ok {
				if field.Nullable {
					continue
				} else {
					value = ""
				}
			}

			if propsStr != "" {
				propsStr += ","
			}
			propsStr += fmt.Sprintf("`%s`", key)
			if valueStr != "" {
				valueStr += ","
			}
			if strings.Contains(strings.ToLower(field.DataType), "string") {
				valueStr += fmt.Sprintf(`"%v"`, value)
			} else {
				valueStr += fmt.Sprintf(`%v`, value)
			}
		}

		gql := fmt.Sprintf("INSERT VERTEX `%s` ({props}) VALUES \"%s\":({value});", typ, name)
		gql = strings.ReplaceAll(gql, "{props}", propsStr)
		gql = strings.ReplaceAll(gql, "{value}", valueStr)
		gqls = append(gqls, gql)
	}

	for _, src := range i.CacheEdges {
		for _, dst := range src {
			propsName := ""
			propsValue := ""
			typeSchema, ok := i.SchemaMap[dst.EdgeType]
			if !ok {
				continue
			}
			for key, field := range typeSchema {
				value, ok := dst.Props[key]
				if !ok {
					if field.Nullable {
						continue
					} else {
						value = ""
					}
				}
				if propsName != "" {
					propsName += ","
				}
				propsName += fmt.Sprintf("`%s`", key)
				if propsValue != "" {
					propsValue += ","
				}
				if strings.Contains(strings.ToLower(field.DataType), "string") {
					propsValue += fmt.Sprintf(`"%v"`, value)
				} else {
					propsValue += fmt.Sprintf(`%v`, value)
				}
			}
			gql := fmt.Sprintf("INSERT EDGE `%s` (%s) VALUES \"%s\"->\"%s\":(%s);", dst.EdgeType, propsName, dst.Src, dst.Dst, propsValue)
			gqls = append(gqls, gql)
		}
	}

	gqlStr := strings.Join(gqls, "\n")
	file, err := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	_, err = file.WriteString(gqlStr)
	if err != nil {
		return nil, err
	}
	i.WriteLogFile(fmt.Sprintf("make gql file success, path:%s, gqls length: %d", filePath, len(gqls)), "info")
	return gqls, nil
}

func (i *ImportJob) RunGQLFile(gqls []string) error {
	i.WriteLogFile(fmt.Sprintf("start run gql, gqls length: %d", len(gqls)), "info")
	batchSize := config.GetConfig().LLM.GQLBatchSize
	for index := 0; index < len(gqls); index += batchSize {
		if IsRunningJobStopped(i.LLMJob.JobID) {
			return fmt.Errorf("job stopped")
		}
		maxEnd := index + batchSize
		if maxEnd > len(gqls) {
			maxEnd = len(gqls)
		}
		res, err := client.Execute(i.NSID, i.LLMJob.Space, gqls[index:maxEnd])
		if err != nil {
			i.WriteLogFile(fmt.Sprintf("run gql error: %v,index:%d,gqls:%v", err, index, gqls[index:maxEnd]), "error")
		} else {
			errors := make([]string, 0)
			success := make([]string, 0)
			for _, r := range res {
				if r.Error != nil {
					// i.WriteLogFile(fmt.Sprintf("run gql error: %v,gql:%s", r.Error, r.Gql), "error")
					errors = append(errors, fmt.Sprintf("%s @error: %v", r.Gql, r.Error))
				} else {
					success = append(success, r.Gql)
				}
			}
			if len(success) > 0 {
				i.WriteLogFile(fmt.Sprintf("run gql success:\n %s ", strings.Join(success, "\n")), "info")
			}
			if len(errors) > 0 {
				i.WriteLogFile(fmt.Sprintf("run gql error:\n %s ", strings.Join(errors, "\n")), "error")
			}
		}
	}
	return nil
}

func (i *ImportJob) MakeSchema() error {
	schema := Schema{
		Space: i.LLMJob.Space,
	}
	gql := fmt.Sprintf("DESCRIBE SPACE `%s`", i.LLMJob.Space)
	spaceInfo, err := client.Execute(i.NSID, i.LLMJob.Space, []string{gql})
	if err != nil {
		return err
	}
	result := spaceInfo[0]
	if result.Error != nil {
		return result.Error
	}
	row, ok := result.Result.Tables[0]["Vid Type"]
	if !ok {
		return fmt.Errorf("get space vid type error")
	}
	schema.VidType = row.(string)

	gql = ("SHOW TAGS")
	res, err := client.Execute(i.NSID, i.LLMJob.Space, []string{gql})
	if err != nil {
		return err
	}
	tagResult := res[0]
	if tagResult.Error != nil {
		return tagResult.Error
	}
	for _, row := range tagResult.Result.Tables {
		tag := NodeType{
			Type: row["Name"].(string),
		}
		gql = fmt.Sprintf("DESCRIBE TAG `%s`", tag.Type)
		res, err := client.Execute(i.NSID, i.LLMJob.Space, []string{gql})
		if err != nil {
			return err
		}
		tagInfoResult := res[0]
		if tagInfoResult.Error != nil {
			return tagInfoResult.Error
		}
		for _, row := range tagInfoResult.Result.Tables {
			field := Field{
				Name:     row["Field"].(string),
				DataType: row["Type"].(string),
			}
			if row["Null"].(string) == "YES" {
				field.Nullable = true
			} else {
				field.Nullable = false
			}
			tag.Props = append(tag.Props, field)
		}
		schema.NodeTypes = append(schema.NodeTypes, tag)
	}

	gql = ("SHOW EDGES")
	res, err = client.Execute(i.NSID, i.LLMJob.Space, []string{gql})
	if err != nil {
		return err
	}
	edgeResult := res[0]
	if edgeResult.Error != nil {
		return edgeResult.Error
	}
	for _, row := range edgeResult.Result.Tables {
		edge := EdgeType{
			Type: row["Name"].(string),
		}
		gql = fmt.Sprintf("DESCRIBE EDGE `%s`", edge.Type)
		res, err := client.Execute(i.NSID, i.LLMJob.Space, []string{gql})
		if err != nil {
			return err
		}
		edgeInfoResult := res[0]
		if edgeInfoResult.Error != nil {
			return edgeInfoResult.Error
		}
		for _, row := range edgeInfoResult.Result.Tables {
			field := Field{
				Name:     row["Field"].(string),
				DataType: row["Type"].(string),
			}
			if row["Null"].(string) == "YES" {
				field.Nullable = true
			} else {
				field.Nullable = false
			}
			edge.Props = append(edge.Props, field)
		}
		schema.EdgeTypes = append(schema.EdgeTypes, edge)
	}
	i.Schema = schema
	return nil
}
