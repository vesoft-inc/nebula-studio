#!/bin/bash

# will exec before studio rpm rm

# kill nebula-http-gateway server
set +e
cd /usr/local/nebula-graph-studio/
bash ./scripts/stop.sh
set -e
