#!/bin/bash

cd /usr/local/nebula-graph-studio/
npm run start
nohup ./vendors/nebula-http-gateway/nebula-httpd &
