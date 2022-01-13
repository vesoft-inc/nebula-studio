#!/usr/bin/env bash

set -ex
DIR=`pwd`
STUDIO=$DIR/source/nebula-graph-studio

# build web
cd $STUDIO
bash ./scripts/setEventTracking.sh $1
VERSION=`cat package.json | grep '"version":' | awk 'NR==1{print $2}' | awk -F'"' '{print $2}'`

sed -i "s/CPACK_PACKAGE_VERSION_TEMPLATE/$VERSION/g" ./scripts/deb/CMakeLists.txt
sed -i "s/CPACK_PACKAGE_VERSION_TEMPLATE/$VERSION/g" ./scripts/rpm/CMakeLists.txt
npm install --unsafe-perm
npm run build

cp -r $STUDIO/dist/. $STUDIO/server/assets

# build server
cd $STUDIO/server
go build -o server

