#!/bin/bash

# will exec when studio rpm installed
cd $RPM_INSTALL_PREFIX/nebula-graph-studio/
sed -i "s?PREFIX_TEMPLATE?$RPM_INSTALL_PREFIX?g" `grep -rl "PREFIX_TEMPLATE" ./scripts/`
chmod 755 ./server
chmod 777 ./tmp/

bash ./scripts/start.sh
