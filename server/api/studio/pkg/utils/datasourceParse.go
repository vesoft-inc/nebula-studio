package utils

import (
	"fmt"
	"net/url"
	"strings"
)

func ParseEndpoint(platform, rawEndpoint string) (string, string, error) {
	if platform != "aws" {
		return rawEndpoint, "", nil
	}
	// endpointURL := "https://s3.<region>.amazonaws.com"
	// endpointURL := "https://my-bucket.s3.<region>.amazonaws.com"
	// endpointURL := "https://s3.<region>.amazonaws.com/my-bucket"
	if !strings.HasPrefix(rawEndpoint, "https://") && !strings.HasPrefix(rawEndpoint, "http://") {
		rawEndpoint = fmt.Sprintf("https://%s", rawEndpoint)
	}
	u, err := url.Parse(rawEndpoint)
	if err != nil {
		return "", "", err
	}
	host := u.Hostname()
	parts := strings.SplitN(host, ".", 2)
	fmt.Println("host", host, parts)
	var (
		bucket   string
		endpoint string
	)
	if parts[0] == "s3" {
		// Format: https://s3.<region>.amazonaws.com
		endpoint = fmt.Sprintf("https://%s", u.Host)
		if u.Path != "" {
			pathParts := strings.SplitN(u.Path, "/", 3)
			bucket = pathParts[1]
		}
	} else {
		// Format: https://<bucket-name>.s3.<region>.amazonaws.com or https://s3.amazonaws.com/<bucket-name>
		if parts[0] == "s3.amazonaws" {
			// Format: https://s3.amazonaws.com/<bucket-name>
			endpoint = fmt.Sprintf("https://%s", u.Host)
			if u.Path != "" {
				pathParts := strings.SplitN(u.Path, "/", 3)
				bucket = pathParts[1]
			}
		} else {
			// Format: https://<bucket-name>.s3.<region>.amazonaws.com
			bucket = parts[0]
			endpoint = fmt.Sprintf("https://%s", parts[1])
		}
	}
	return endpoint, bucket, nil
}
