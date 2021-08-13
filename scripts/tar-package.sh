set -ex

DIR=`pwd`
STUDIO=$DIR/source/nebula-graph-studio

# build target dir
TARGET=$DIR/nebula-graph-studio
mkdir $TARGET
mkdir -p $TARGET/nebula-importer/
mkdir -p $TARGET/nebula-http-gateway/

### nebula-http-gateway ###
GATEWAY=$DIR/source/nebula-http-gateway
cd $GATEWAY
make
TARGET_GATEWAY=$TARGET/nebula-http-gateway
mkdir -p $TARGET_GATEWAY/conf
mv $STUDIO/vendors/gateway.conf $TARGET_GATEWAY/conf/app.conf
mv $GATEWAY/nebula-httpd $TARGET_GATEWAY/

### nebula-importer
IMPORTER=$DIR/source/nebula-importer
cd $IMPORTER
make build
mv $IMPORTER/nebula-importer $TARGET/nebula-importer/


### nebula graph studio relative ###
cd $STUDIO

bash ./scripts/setEventTracking.sh $1

VERSION=`cat package.json | grep '"version":' | awk 'NR==1{print $2}' | awk -F'"' '{print $2}'`
RELEASE=`cat package.json | grep '"release":' | awk 'NR==1{print $2}' | awk -F'"' '{print $2}'`

npm install --unsafe-perm
npm run build
npm run tsc
cp -r $STUDIO $TARGET/
cp $STUDIO/DEPLOY.md $TARGET/

cd $TARGET/nebula-graph-studio

# remove the no use file for deploy
rm -rf ./.git ./app/assets/
mkdir -p ./app/assets/
# index.html need to be saved
cp $STUDIO/app/assets/index.html  ./app/assets/

### tar
cd $DIR
tar -czf nebula-graph-studio-$VERSION-$RELEASE.x86_64.tar.gz nebula-graph-studio