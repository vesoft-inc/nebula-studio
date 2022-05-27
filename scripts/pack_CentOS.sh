#!/usr/bin/env bash
# package studio as one rpm and tar.gz

set -ex

DIR=`pwd`
STUDIO=$DIR/source/nebula-graph-studio
SERVER=$STUDIO/server/api/studio

cd $STUDIO
VERSION=`cat package.json | grep '"version":' | awk 'NR==1{print $2}' | awk -F'"' '{print $2}'`

# build rpm target dir
RPM_TARGET=$DIR/package
mkdir -p $RPM_TARGET

cp -r $STUDIO/scripts/rpm $RPM_TARGET/scripts/
mv $RPM_TARGET/scripts/CMakeLists.txt $RPM_TARGET/

cp -r $SERVER/etc $RPM_TARGET/
cp -r $SERVER/server $RPM_TARGET/

cd $RPM_TARGET
mkdir -p tmp
cmake . -B ./tmp
cd ./tmp
cpack -G RPM
ls -a

# build target dir
TAR_TARGET=$DIR/nebula-graph-studio
mkdir -p $TAR_TARGET

cp -r $SERVER/etc $TAR_TARGET/
cp -r $SERVER/server $TAR_TARGET/

cd $DIR
tar -czf nebula-graph-studio-$VERSION.x86_64.tar.gz nebula-graph-studio

# build docker-compose dir
cd $DIR
tar -czf nebula-graph-studio-$VERSION.tar.gz -C $STUDIO/deployment/docker .
