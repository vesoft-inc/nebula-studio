set -ex

DIR=`pwd`
STUDIO=$DIR/source/nebula-graph-studio
cd $STUDIO
VERSION=`cat package.json | grep '"version":' | awk 'NR==1{print $2}' | awk -F'"' '{print $2}'`
cd $STUDIO/tmp/
ossutil64 -e $1 -i $2 -k $3 -f cp ./  $4${VERSION} --include "nebula-graph-studio-*.rpm*" --only-current-dir -r