#!/bin/bash

# will exec before explorer rpm rm

set +e
cd $RPM_INSTALL_PREFIX/nebula-graph-studio/
bash ./scripts/stop.sh
set -e
