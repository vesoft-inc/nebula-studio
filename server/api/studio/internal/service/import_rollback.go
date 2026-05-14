package service

import (
	"bufio"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service/importer"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/client"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/filestore"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
)

const rollbackBatchSize = 200

type rollbackRawConfig struct {
	TagConfig  []rollbackTagConfig  `json:"tagConfig"`
	EdgeConfig []rollbackEdgeConfig `json:"edgeConfig"`
}

type rollbackTagConfig struct {
	Name  string            `json:"name"`
	Files []rollbackTagFile `json:"files"`
}

type rollbackEdgeConfig struct {
	Name  string             `json:"name"`
	Files []rollbackEdgeFile `json:"files"`
}

type rollbackFileConfig struct {
	Name         string `json:"name"`
	WithHeader   bool   `json:"withHeader"`
	Delimiter    string `json:"delimiter"`
	DatasourceID string `json:"datasourceId"`
	Path         string `json:"path"`
}

type rollbackTagFile struct {
	File      rollbackFileConfig `json:"file"`
	VIDIndex  []int              `json:"vidIndex"`
	VIDPrefix string             `json:"vidPrefix"`
	VIDSuffix string             `json:"vidSuffix"`
	VIDFunc   string             `json:"vidFunction"`
}

type rollbackEdgeProp struct {
	Mapping *int `json:"mapping"`
}

type rollbackEdgeFile struct {
	File        rollbackFileConfig `json:"file"`
	Props       []rollbackEdgeProp `json:"props"`
	SrcIDIndex  []int              `json:"srcIdIndex"`
	DstIDIndex  []int              `json:"dstIdIndex"`
	SrcIDPrefix string             `json:"srcIdPrefix"`
	SrcIDSuffix string             `json:"srcIdSuffix"`
	DstIDPrefix string             `json:"dstIdPrefix"`
	DstIDSuffix string             `json:"dstIdSuffix"`
	SrcIDFunc   string             `json:"srcIdFunction"`
	DstIDFunc   string             `json:"dstIdFunction"`
}

func (i *importService) RollbackImportTask(req *types.RollbackImportTaskRequest) error {
	authData := i.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := fmt.Sprintf("%s:%d", authData.Address, authData.Port)

	task := &db.TaskInfo{}
	if err := db.CtxDB.Where("b_id = ? AND address = ?", req.Id, host).First(task).Error; err != nil {
		return ecode.WithErrorMessage(ecode.ErrNotFound, err, "task not found")
	}
	if authData.Username != "root" && task.User != authData.Username {
		return ecode.WithErrorMessage(ecode.ErrForbidden, errors.New("permission denied"), "no permission to rollback task")
	}
	if task.TaskStatus == importer.Processing.String() || task.TaskStatus == "Pending" || task.TaskStatus == importer.Draft.String() {
		return ecode.WithErrorMessage(ecode.ErrBadRequest, fmt.Errorf("task status %s is not supported for rollback", task.TaskStatus))
	}

	isStringVID, err := i.getSpaceVIDStringType(task.Space, authData.NSID)
	if err != nil {
		return err
	}

	rollbackData, parseMode, err := i.parseRollbackConfig(task.RawConfig)
	if err != nil {
		return err
	}

	vertexSet := make(map[string]struct{})
	edgeByType := make(map[string]map[string]struct{})
	switch parseMode {
	case "raw":
		if err := i.collectRollbackTargetsFromRawConfig(authData, rollbackData.raw, isStringVID, vertexSet, edgeByType); err != nil {
			return err
		}
	case "importer":
		if err := i.collectRollbackTargetsFromImporterConfig(authData, rollbackData.importer, isStringVID, vertexSet, edgeByType); err != nil {
			return err
		}
	default:
		return ecode.WithErrorMessage(ecode.ErrBadRequest, fmt.Errorf("unsupported rollback config"))
	}

	gqls := buildRollbackGQLs(vertexSet, edgeByType)
	if len(gqls) == 0 {
		return ecode.WithErrorMessage(ecode.ErrBadRequest, fmt.Errorf("no rollback targets found"))
	}

	for start := 0; start < len(gqls); start += rollbackBatchSize {
		end := start + rollbackBatchSize
		if end > len(gqls) {
			end = len(gqls)
		}
		results, execErr := client.Execute(authData.NSID, task.Space, gqls[start:end])
		if execErr != nil {
			return ecode.WithErrorMessage(ecode.ErrInternalServer, execErr, "execute rollback failed")
		}
		for idx, result := range results {
			if result.Error != nil {
				return ecode.WithErrorMessage(ecode.ErrInternalServer, result.Error, "execute rollback failed: "+gqls[start+idx])
			}
		}
	}

	return nil
}

type parsedRollbackConfig struct {
	raw      *rollbackRawConfig
	importer *types.ImportTaskConfig
}

func (i *importService) parseRollbackConfig(raw string) (*parsedRollbackConfig, string, error) {
	rawCfg := &rollbackRawConfig{}
	if err := json.Unmarshal([]byte(raw), rawCfg); err == nil && (len(rawCfg.TagConfig) > 0 || len(rawCfg.EdgeConfig) > 0) {
		return &parsedRollbackConfig{raw: rawCfg}, "raw", nil
	}

	var importerCfgStr string
	if err := json.Unmarshal([]byte(raw), &importerCfgStr); err == nil && importerCfgStr != "" {
		importerCfg := &types.ImportTaskConfig{}
		if unmarshalErr := json.Unmarshal([]byte(importerCfgStr), importerCfg); unmarshalErr == nil && len(importerCfg.Sources) > 0 {
			return &parsedRollbackConfig{importer: importerCfg}, "importer", nil
		}
	}

	return nil, "", ecode.WithErrorMessage(ecode.ErrBadRequest, fmt.Errorf("task does not contain rollback metadata"))
}

func (i *importService) collectRollbackTargetsFromRawConfig(
	authData *auth.AuthData,
	cfg *rollbackRawConfig,
	isStringVID bool,
	vertexSet map[string]struct{},
	edgeByType map[string]map[string]struct{},
) error {
	for _, tagCfg := range cfg.TagConfig {
		for _, fileCfg := range tagCfg.Files {
			rows, err := i.readSourceRows(authData, fileCfg.File)
			if err != nil {
				return err
			}
			for _, row := range rows {
				vidExpr, buildErr := buildVIDExprByIndices(row, fileCfg.VIDIndex, fileCfg.VIDPrefix, fileCfg.VIDSuffix, fileCfg.VIDFunc, isStringVID)
				if buildErr != nil {
					continue
				}
				vertexSet[vidExpr] = struct{}{}
			}
		}
	}

	for _, edgeCfg := range cfg.EdgeConfig {
		edgeType := edgeCfg.Name
		if edgeByType[edgeType] == nil {
			edgeByType[edgeType] = make(map[string]struct{})
		}
		for _, fileCfg := range edgeCfg.Files {
			rows, err := i.readSourceRows(authData, fileCfg.File)
			if err != nil {
				return err
			}
			var rankIndex *int
			if len(fileCfg.Props) > 0 {
				rankIndex = fileCfg.Props[len(fileCfg.Props)-1].Mapping
			}
			for _, row := range rows {
				srcExpr, srcErr := buildVIDExprByIndices(row, fileCfg.SrcIDIndex, fileCfg.SrcIDPrefix, fileCfg.SrcIDSuffix, fileCfg.SrcIDFunc, isStringVID)
				dstExpr, dstErr := buildVIDExprByIndices(row, fileCfg.DstIDIndex, fileCfg.DstIDPrefix, fileCfg.DstIDSuffix, fileCfg.DstIDFunc, isStringVID)
				if srcErr != nil || dstErr != nil {
					continue
				}
				edgeTuple := buildEdgeTuple(srcExpr, dstExpr, rankIndex, row)
				edgeByType[edgeType][edgeTuple] = struct{}{}
			}
		}
	}

	return nil
}

func (i *importService) collectRollbackTargetsFromImporterConfig(
	authData *auth.AuthData,
	cfg *types.ImportTaskConfig,
	isStringVID bool,
	vertexSet map[string]struct{},
	edgeByType map[string]map[string]struct{},
) error {
	for _, source := range cfg.Sources {
		fileCfg := rollbackFileConfig{
			Name:         source.Path,
			WithHeader:   source.CSV.WithHeader != nil && *source.CSV.WithHeader,
			Delimiter:    stringValue(source.CSV.Delimiter),
			DatasourceID: stringValue(source.DatasourceId),
			Path:         stringValue(source.DatasourceFilePath),
		}
		rows, err := i.readSourceRows(authData, fileCfg)
		if err != nil {
			return err
		}

		for _, tag := range source.Tags {
			for _, row := range rows {
				vidExpr, buildErr := buildVIDExprByNodeID(row, tag.ID, isStringVID)
				if buildErr != nil {
					continue
				}
				vertexSet[vidExpr] = struct{}{}
			}
		}

		for _, edge := range source.Edges {
			if edgeByType[edge.Name] == nil {
				edgeByType[edge.Name] = make(map[string]struct{})
			}
			for _, row := range rows {
				srcExpr, srcErr := buildVIDExprByNodeID(row, edge.Src.ID, isStringVID)
				dstExpr, dstErr := buildVIDExprByNodeID(row, edge.Dst.ID, isStringVID)
				if srcErr != nil || dstErr != nil {
					continue
				}
				edgeTuple := buildEdgeTupleByRankConfig(srcExpr, dstExpr, edge.Rank, row)
				edgeByType[edge.Name][edgeTuple] = struct{}{}
			}
		}
	}
	return nil
}

func buildRollbackGQLs(vertexSet map[string]struct{}, edgeByType map[string]map[string]struct{}) []string {
	gqls := make([]string, 0)
	for edgeType, tuples := range edgeByType {
		if len(tuples) == 0 {
			continue
		}
		tupleList := mapKeys(tuples)
		for start := 0; start < len(tupleList); start += rollbackBatchSize {
			end := start + rollbackBatchSize
			if end > len(tupleList) {
				end = len(tupleList)
			}
			gqls = append(gqls, fmt.Sprintf("DELETE EDGE `%s` %s", escapeIdentifier(edgeType), strings.Join(tupleList[start:end], ", ")))
		}
	}

	vidList := mapKeys(vertexSet)
	for start := 0; start < len(vidList); start += rollbackBatchSize {
		end := start + rollbackBatchSize
		if end > len(vidList) {
			end = len(vidList)
		}
		gqls = append(gqls, fmt.Sprintf("DELETE VERTEX %s", strings.Join(vidList[start:end], ", ")))
	}

	return gqls
}

func (i *importService) readSourceRows(authData *auth.AuthData, fileCfg rollbackFileConfig) ([][]string, error) {
	lines, err := i.readSourceLines(authData, fileCfg)
	if err != nil {
		return nil, err
	}
	rows := make([][]string, 0, len(lines))
	start := 0
	if fileCfg.WithHeader {
		start = 1
	}
	for idx := start; idx < len(lines); idx++ {
		parsed, parseErr := parseCSVLine(lines[idx], fileCfg.Delimiter)
		if parseErr != nil {
			continue
		}
		rows = append(rows, parsed)
	}
	return rows, nil
}

func (i *importService) readSourceLines(authData *auth.AuthData, fileCfg rollbackFileConfig) ([]string, error) {
	if fileCfg.DatasourceID != "" {
		host := fmt.Sprintf("%s:%d", authData.Address, authData.Port)
		dbs := &db.Datasource{}
		if err := db.CtxDB.Where("b_id = ? AND host = ?", fileCfg.DatasourceID, host).First(dbs).Error; err != nil {
			return nil, ecode.WithErrorMessage(ecode.ErrBadRequest, err, "datasource not found")
		}
		secret, decryptErr := utils.Decrypt(dbs.Secret, []byte(cipher))
		if decryptErr != nil {
			return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, decryptErr)
		}
		store, storeErr := filestore.NewFileStore(dbs.Type, dbs.Config, string(secret), dbs.Platform)
		if storeErr != nil {
			return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, storeErr, "create datasource store failed")
		}
		defer store.Close()
		remotePath := fileCfg.Path
		if remotePath == "" {
			remotePath = fileCfg.Name
		}
		lines, readErr := store.ReadFile(remotePath)
		if readErr != nil {
			return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, readErr, "read datasource file failed")
		}
		return lines, nil
	}

	localPath := filepath.Join(i.svcCtx.Config.File.UploadDir, fileCfg.Name)
	file, err := os.Open(localPath)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err, "open local file failed")
	}
	defer file.Close()
	lines := make([]string, 0)
	scanner := bufio.NewScanner(file)
	scanner.Buffer(make([]byte, 0, 64*1024), 10*1024*1024)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err, "scan local file failed")
	}
	return lines, nil
}

func (i *importService) getSpaceVIDStringType(space, nsid string) (bool, error) {
	gql := fmt.Sprintf("SHOW CREATE SPACE `%s`", escapeIdentifier(space))
	results, err := client.Execute(nsid, "", []string{gql})
	if err != nil {
		return false, ecode.WithErrorMessage(ecode.ErrInternalServer, err, "query space schema failed")
	}
	if len(results) == 0 || results[0].Error != nil {
		if len(results) > 0 && results[0].Error != nil {
			return false, ecode.WithErrorMessage(ecode.ErrInternalServer, results[0].Error, "query space schema failed")
		}
		return false, ecode.WithErrorMessage(ecode.ErrInternalServer, fmt.Errorf("empty result for show create space"))
	}

	stmt := ""
	for _, row := range results[0].Result.Tables {
		for _, val := range row {
			str := strings.ToUpper(fmt.Sprint(val))
			if strings.Contains(str, "CREATE SPACE") && strings.Contains(str, "VID_TYPE") {
				stmt = str
				break
			}
		}
	}
	if stmt == "" {
		return true, nil
	}
	return strings.Contains(stmt, "VID_TYPE=FIXED_STRING") || strings.Contains(stmt, "VID_TYPE = FIXED_STRING"), nil
}

func parseCSVLine(line, delimiter string) ([]string, error) {
	reader := csv.NewReader(strings.NewReader(line))
	reader.FieldsPerRecord = -1
	reader.LazyQuotes = true
	if delimiter != "" {
		runes := []rune(delimiter)
		reader.Comma = runes[0]
	}
	return reader.Read()
}

func buildVIDExprByIndices(
	fields []string,
	indices []int,
	prefix, suffix, fn string,
	isStringVID bool,
) (string, error) {
	if len(indices) == 0 {
		return "", fmt.Errorf("empty id index")
	}
	raw, err := composeRawID(fields, indices, prefix, suffix)
	if err != nil {
		return "", err
	}
	return buildVIDExpr(raw, fn, isStringVID)
}

func buildVIDExprByNodeID(fields []string, id types.NodeId, isStringVID bool) (string, error) {
	raw := ""
	if len(id.ConcatItems) > 0 {
		builder := strings.Builder{}
		for _, item := range id.ConcatItems {
			switch v := item.(type) {
			case string:
				builder.WriteString(v)
			case float64:
				idx := int(v)
				if idx < 0 || idx >= len(fields) {
					return "", fmt.Errorf("id index out of range")
				}
				builder.WriteString(fields[idx])
			default:
				return "", fmt.Errorf("unsupported concat item type")
			}
		}
		raw = builder.String()
	} else {
		idx := int(id.Index)
		if idx < 0 || idx >= len(fields) {
			return "", fmt.Errorf("id index out of range")
		}
		raw = fields[idx]
	}
	return buildVIDExpr(raw, id.Function, isStringVID)
}

func buildVIDExpr(raw, fn string, isStringVID bool) (string, error) {
	if fn != "" {
		return "", fmt.Errorf("rollback currently does not support vid function: %s", fn)
	}
	if isStringVID {
		return strconv.Quote(raw), nil
	}
	if _, err := strconv.ParseInt(raw, 10, 64); err == nil {
		return raw, nil
	}
	return strconv.Quote(raw), nil
}

func composeRawID(fields []string, indices []int, prefix, suffix string) (string, error) {
	builder := strings.Builder{}
	if prefix != "" {
		builder.WriteString(prefix)
	}
	for _, idx := range indices {
		if idx < 0 || idx >= len(fields) {
			return "", fmt.Errorf("id index out of range")
		}
		builder.WriteString(fields[idx])
	}
	if suffix != "" {
		builder.WriteString(suffix)
	}
	return builder.String(), nil
}

func buildEdgeTuple(srcExpr, dstExpr string, rankIndex *int, fields []string) string {
	if rankIndex == nil || *rankIndex < 0 || *rankIndex >= len(fields) {
		return fmt.Sprintf("%s->%s", srcExpr, dstExpr)
	}
	rank, err := strconv.ParseInt(fields[*rankIndex], 10, 64)
	if err != nil {
		return fmt.Sprintf("%s->%s", srcExpr, dstExpr)
	}
	return fmt.Sprintf("%s->%s@%d", srcExpr, dstExpr, rank)
}

func buildEdgeTupleByRankConfig(srcExpr, dstExpr string, rank *types.EdgeRank, fields []string) string {
	if rank == nil || rank.Index == nil {
		return fmt.Sprintf("%s->%s", srcExpr, dstExpr)
	}
	idx := int(*rank.Index)
	if idx < 0 || idx >= len(fields) {
		return fmt.Sprintf("%s->%s", srcExpr, dstExpr)
	}
	parsedRank, err := strconv.ParseInt(fields[idx], 10, 64)
	if err != nil {
		return fmt.Sprintf("%s->%s", srcExpr, dstExpr)
	}
	return fmt.Sprintf("%s->%s@%d", srcExpr, dstExpr, parsedRank)
}

func mapKeys[V any](m map[string]V) []string {
	keys := make([]string, 0, len(m))
	for key := range m {
		keys = append(keys, key)
	}
	return keys
}

func stringValue(v *string) string {
	if v == nil {
		return ""
	}
	return *v
}

func escapeIdentifier(name string) string {
	return strings.ReplaceAll(name, "`", "``")
}
