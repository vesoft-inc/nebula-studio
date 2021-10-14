#!/bin/bash

# stop nebula-http-gateway
kill -9 $(lsof -t -i :8080)

# stop nebula-graph-studio
kill -9 $(lsof -t -i :7001)

