#!/usr/bin/env bash
# package studio as one deb

set -ex

DIR=`pwd`
STUDIO=$DIR/source/nebula-graph-studio

# build target dir
PACKAGE=$DIR/package
mkdir -p $PACKAGE

cp -r $STUDIO/scripts/deb $PACKAGE/lib/
mv $PACKAGE/lib/CMakeLists.txt $PACKAGE/

cp -r $STUDIO/server/config $PACKAGE/
cp -r $STUDIO/server/server $PACKAGE/

cd $PACKAGE
mkdir -p tmp
cmake . -B ./tmp
cd ./tmp
cpack -G DEB