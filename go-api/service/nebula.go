package graphdb

import (
	"log"

	nebula "github.com/vesoft-inc/nebula-go"
)

// Connect return if the nebula connect succeed
func Connect(ip string, username string, password string) bool {
	client, err := nebula.NewClient(ip)
	if err != nil {
		log.Fatal(err)
	}

	err = client.Connect(username, password)
	if err != nil {
		log.Fatal(err)
		return false
	}
	defer client.Disconnect()
	return true

	// if resp, err := client.Execute("SHOW HOSTS;"); err != nil {
	// 	log.Fatal(err)
	// } else {
	// 	if resp.GetErrorCode() != graph.ErrorCode_SUCCEEDED {
	// 		log.Printf("ErrorCode: %v, ErrorMsg: %s", resp.GetErrorCode(), resp.GetErrorCode())
	// 	}
	// 	log.Printf("success %s", resp.GetColumnNames())
	// }
}

func Execute(ip, username, password, gql string) {

}
