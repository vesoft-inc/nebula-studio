#!/usr/bin/env bash
# package studio as one rpm

set -ex

DIR=`pwd`
STUDIO=$DIR/source/nebula-graph-studio

# build target dir
RPM_TARGET=$DIR/package
mkdir -p $RPM_TARGET

# build target dir
TAR_TARGET=$DIR/nebula-graph-studio
mkdir -p $TAR_TARGET

cd $STUDIO
bash ./scripts/setEventTracking.sh $1
VERSION=`cat package.json | grep '"version":' | awk 'NR==1{print $2}' | awk -F'"' '{print $2}'`
sed -i "s/CPACK_PACKAGE_VERSION_TEMPLATE/$VERSION/g" CMakeLists.txt
npm install --unsafe-perm
npm run build

cp -r $STUDIO/dist $STUDIO/server/assets
cp -r $STUDIO/dist $STUDIO/server/assets

cp -r $STUDIO/scripts/rpm $RPM_TARGET/scripts/
cp -r $STUDIO/CMakeLists.txt $RPM_TARGET/

# build web server
cd $STUDIO/server
go build -o server

cp -r $STUDIO/server/config $TAR_TARGET/
cp -r server $TAR_TARGET/

cp -r $STUDIO/server/config $RPM_TARGET/
cp -r server $RPM_TARGET/

### tar
cd $DIR
tar -czf nebula-graph-studio-$VERSION.x86_64.tar.gz nebula-graph-studio

cd $RPM_TARGET
mkdir -p tmp
cmake . -B ./tmp
cd ./tmp
cpack -G RPM
ls -a