#!/bin/bash
cd PREFIX_TEMPLATE/nebula-graph-studio/
cp ./scripts/nebula-graph-studio.service /usr/lib/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable nebula-graph-studio.service && sudo systemctl start nebula-graph-studio.service
echo "NebulaGraph Studio started automatically."