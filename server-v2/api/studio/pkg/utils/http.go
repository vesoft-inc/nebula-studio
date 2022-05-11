package utils

import (
	"bytes"
	"io"
	"io/ioutil"
	"net/http"
)

const MIMEOctetStream = "application/octet-stream"

func CopyHttpRequest(r *http.Request) *http.Request {
	reqCopy := new(http.Request)

	if r == nil {
		return reqCopy
	}

	*reqCopy = *r

	if r.Body != nil {
		defer r.Body.Close()

		// Buffer body data
		var bodyBuffer bytes.Buffer
		newBodyBuffer := new(bytes.Buffer)

		io.Copy(&bodyBuffer, r.Body)
		*newBodyBuffer = bodyBuffer

		// Create new ReadClosers so we can split output
		r.Body = ioutil.NopCloser(&bodyBuffer)
		reqCopy.Body = ioutil.NopCloser(newBodyBuffer)
	}

	return reqCopy
}

func DisabledCookie(name string) *http.Cookie {
	return &http.Cookie{
		Name:     name,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	}
}
