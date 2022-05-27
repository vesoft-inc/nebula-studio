#!/usr/bin/env bash

set -ex
# build web
bash ./scripts/setEventTracking.sh $1
VERSION=`cat package.json | grep '"version":' | awk 'NR==1{print $2}' | awk -F'"' '{print $2}'`

sed -i "s/CPACK_PACKAGE_VERSION_TEMPLATE/$VERSION/g" ./scripts/deb/CMakeLists.txt
sed -i "s/CPACK_PACKAGE_VERSION_TEMPLATE/$VERSION/g" ./scripts/rpm/CMakeLists.txt
npm install --unsafe-perm
npm run build

cp -r ./dist/. ./server/api/studio/assets

# build server
sed -i "s/9000/7001/g" ./server/api/studio/etc/studio-api.yaml
cd ./server/api/studio
go build -o server

