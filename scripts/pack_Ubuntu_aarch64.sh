#!/usr/bin/env bash
# package studio as one deb

set -ex

DIR=`pwd`
STUDIO=$DIR/source/nebula-graph-studio
SERVER=$STUDIO/server/api/studio

# build target dir
PACKAGE=$DIR/package
mkdir -p $PACKAGE

cp -r $STUDIO/scripts/deb $PACKAGE/lib/
cp $PACKAGE/lib/CMakeLists.txt $PACKAGE/

cp -r $SERVER/etc $PACKAGE/
cp -r $SERVER/server $PACKAGE/

cd $PACKAGE
sed -i 's/x86_64/aarch64/g' CMakeLists.txt
mkdir -p tmp
cmake . -B ./tmp
cd ./tmp
cpack -G DEB