package middleware

import (
	"net/http"
	"net/url"
	"path/filepath"
	"strings"
)

type (
	AssertsConfig struct {
		Prefix     string
		Root       string
		Index      string
		SPA        bool
		Filesystem http.FileSystem
	}

	assertsHandler struct {
		config AssertsConfig
	}
)

func NewAssertsHandler(config AssertsConfig) http.Handler {
	if config.Root == "" {
		config.Root = "."
	}
	if config.Index == "" {
		config.Index = "/index.html"
	} else {
		config.Index = filepath.Clean("/" + config.Index)
	}
	if config.Filesystem == nil {
		config.Filesystem = http.Dir(config.Root)
		config.Root = "."
	}

	return &assertsHandler{
		config: config,
	}
}

func (h *assertsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	urlPath, err := url.PathUnescape(r.URL.Path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	pathInFs := filepath.Clean("/" + urlPath)
	if h.config.Prefix != "" {
		if strings.HasPrefix(urlPath, h.config.Prefix) {
			pathInFs = filepath.Clean("/" + urlPath[len(h.config.Prefix):])
		} else {
			if !h.config.SPA {
				http.NotFound(w, r)
				return
			}
			pathInFs = h.config.Index
		}
	}

	file, err := h.config.Filesystem.Open(filepath.Join(h.config.Root, pathInFs))
	if err != nil {
		if !h.config.SPA || urlPath == h.config.Index {
			http.NotFound(w, r)
			return
		}
		pathInFs = h.config.Index
		file, err = h.config.Filesystem.Open(filepath.Join(h.config.Root, pathInFs))
		if err != nil {
			http.NotFound(w, r)
			return
		}
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		http.NotFound(w, r)
		return
	}

	if stat.IsDir() {
		pathInFs = filepath.Join(pathInFs, h.config.Index)
		file, err = h.config.Filesystem.Open(filepath.Join(h.config.Root, pathInFs))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		defer file.Close()
		stat, err = file.Stat()
		if err != nil || stat.IsDir() {
			http.NotFound(w, r)
			return
		}
	}

	http.ServeContent(w, r, stat.Name(), stat.ModTime(), file)
}
