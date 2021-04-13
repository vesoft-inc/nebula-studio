#!/bin/bash

cd /usr/local/nebula-graph-studio/
npm run start
./vendors/nebula-importer --port 5699 --callback "http://0.0.0.0:7001/api/import/finish" &
./vendors/nebula-http-gateway/nebula-http-gateway &
