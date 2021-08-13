#!/usr/bin/env bash
# package studio as one rpm

set -ex

DIR=`pwd`
STUDIO=$DIR/source/nebula-graph-studio

### nebula-http-gateway ###
GATEWAY=$DIR/source/nebula-http-gateway
TARGET_GATEWAY=$STUDIO/vendors
mkdir -p $TARGET_GATEWAY/nebula-http-gateway/conf

cd $GATEWAY
make
mv $GATEWAY/nebula-httpd $TARGET_GATEWAY/nebula-http-gateway
mv $STUDIO/vendors/gateway.conf $TARGET_GATEWAY/nebula-http-gateway/conf/app.conf

cd $STUDIO

VERSION=`cat package.json | grep '"version":' | awk 'NR==1{print $2}' | awk -F'"' '{print $2}'`
RELEASE=`cat package.json | grep '"release":' | awk 'NR==1{print $2}' | awk -F'"' '{print $2}'`
sed -i "s/CPACK_RPM_PACKAGE_RELEASE_TEMPLATE/$RELEASE/g" CMakeLists.txt
sed -i "s/CPACK_PACKAGE_VERSION_TEMPLATE/$VERSION/g" CMakeLists.txt
npm install --unsafe-perm
npm run build
npm run tsc
tar -czf node_modules.tar.gz node_modules/
mkdir tmp
cmake . -B ./tmp
cd ./tmp
cpack -G RPM
ls -a