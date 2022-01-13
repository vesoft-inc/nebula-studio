#!/usr/bin/env bash
# package studio as one rpm

set -ex

DIR=`pwd`
STUDIO=$DIR/source/nebula-graph-studio

cd $STUDIO
bash ./scripts/build.sh $1
case $2 in
  centos7)
    bash ./scripts/pack_CentOS.sh
    ;;
  ubuntu1604)
    bash ./scripts/pack_Ubuntu.sh
    ;;
esac