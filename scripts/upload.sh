set -ex

DIR=`pwd`
STUDIO=$DIR/source/nebula-graph-studio

cd $STUDIO
VERSION=`cat package.json | grep '"version":' | awk 'NR==1{print $2}' | awk -F'"' '{print $2}'`

case $5 in
  centos7)
    cd $DIR
    ossutil64 -e $1 -i $2 -k $3 -f cp ./  $4${VERSION} --include "nebula-graph-studio-*.tar.gz" --only-current-dir -r
    cd $DIR/package/tmp/
    ossutil64 -e $1 -i $2 -k $3 -f cp ./  $4${VERSION} --include "nebula-graph-studio-*.rpm*" --only-current-dir -r
    ;;
  ubuntu1604)
    cd $DIR/package/tmp/
    ossutil64 -e $1 -i $2 -k $3 -f cp ./  $4${VERSION} --include "nebula-graph-studio-*.deb*" --only-current-dir -r
    ;;
esac
