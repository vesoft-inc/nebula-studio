#!/bin/bash
cd /usr/local/nebula-graph-studio/
cp ./lib/nebula-graph-studio.service /usr/lib/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable nebula-graph-studio.service && sudo systemctl start nebula-graph-studio.service