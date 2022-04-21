#!/bin/bash

# will exec when studio rpm installed
echo "Nebula Studio has been installed."
cd $RPM_INSTALL_PREFIX/nebula-graph-studio/
sed -i "s?PREFIX_TEMPLATE?$RPM_INSTALL_PREFIX?g" `grep -rl "PREFIX_TEMPLATE" ./scripts/`
sudo chmod 755 ./server
sudo chmod 777 ./tmp/

sudo bash ./scripts/start.sh
