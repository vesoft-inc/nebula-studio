#!/bin/bash

# stop nebula-graph-studio
kill -9 $(lsof -t -i :7001)

