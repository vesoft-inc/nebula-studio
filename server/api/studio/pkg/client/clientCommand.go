package client

import (
	"encoding/json"
	"errors"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type ParameterList []string
type ParameterMap map[string]interface{}

// Console side commands
const (
	Unknown = -1
	Param   = 1
	Params  = 2
	Sleep   = 3
)

func isClientCmd(query string) (isLocal bool, localCmd int, args []string) {
	isLocal = false
	localCmd = Unknown
	plain := strings.TrimSpace(query)
	if len(plain) < 1 || plain[0] != ':' {
		return
	}
	isLocal = true
	words := strings.Fields(plain[1:])
	localCmdName := words[0]
	switch strings.ToLower(localCmdName) {
	case "param":
		localCmd = Param
		args = []string{plain}
	case "params":
		localCmd = Params
		args = []string{plain}
	case "sleep":
		localCmd = Sleep
		args = []string{words[1]}
	}
	return
}

func executeClientCmd(cmd int, args []string, parameterMap ParameterMap) (showMap ParameterMap, err error) {
	tempMap := make(ParameterMap)
	switch cmd {
	case Sleep:
		i, err := strconv.Atoi(args[0])
		if err != nil {
			return nil, err
		}
		time.Sleep(time.Duration(i) * time.Second)
	case Param:
		if len(args) == 1 {
			err = defineParams(args[0], parameterMap)
		}
		if err != nil {
			return nil, err
		}
	case Params:
		if len(args) == 1 {
			err = ListParams(args[0], tempMap, parameterMap)
		}
		if err != nil {
			return nil, err
		}
	}
	return tempMap, nil
}

func defineParams(args string, parameterMap ParameterMap) (err error) {
	argsRewritten := strings.Replace(args, "'", "\"", -1)
	reg := regexp.MustCompile(`(?i)^\s*:param\s+(\S+)\s*=>(.*)$`)
	matchResult := reg.FindAllStringSubmatch(argsRewritten, -1)
	if len(matchResult) != 1 || len(matchResult[0]) != 3 {
		return errors.New("Set params failed. Wrong local command format (" + reg.String() + ") ")
	}
	/*
	 * :param p1=> -> [":param p1=>",":p1",""]
	 * :param p2=>3 -> [":param p2=>3",":p2","3"]
	 */
	paramKey := matchResult[0][1]
	paramValue := matchResult[0][2]
	if len(paramValue) == 0 {
		delete(parameterMap, paramKey)
	} else {
		paramsWithGoType := make(ParameterMap)
		param := "{\"" + paramKey + "\"" + ":" + paramValue + "}"
		err = json.Unmarshal([]byte(param), &paramsWithGoType)
		if err != nil {
			return err
		}
		for k, v := range paramsWithGoType {
			parameterMap[k] = v
		}
	}
	return nil
}

func ListParams(args string, tmpParameter ParameterMap, sessionMap ParameterMap) (err error) {
	reg := regexp.MustCompile(`(?i)^\s*:params\s*(\S*)\s*$`)
	matchResult := reg.FindAllStringSubmatch(args, -1)
	if len(matchResult) != 1 {
		return errors.New("Set params failed. Wrong local command format " + reg.String() + ") ")
	}
	res := matchResult[0]
	/*
	 * :params -> [":params",""]
	 * :params p1 -> ["params","p1"]
	 */
	if len(res) != 2 {
		return
	}
	paramKey := matchResult[0][1]
	if len(paramKey) == 0 {
		for k, v := range sessionMap {
			tmpParameter[k] = v
		}
	} else {
		if paramValue, ok := sessionMap[paramKey]; ok {
			tmpParameter[paramKey] = paramValue
		} else {
			err = errors.New("Unknown parameter: " + paramKey)
			return err
		}
	}
	return nil
}
