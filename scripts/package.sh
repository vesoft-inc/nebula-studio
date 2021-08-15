#!/usr/bin/env bash
# package studio as one rpm

set -ex

bash ./scripts/setEventTracking.sh $1

npm install
npm run build
npm run tsc
tar -czf node_modules.tar.gz node_modules/
mkdir tmp
cmake . -B ./tmp
cd ./tmp
cpack -G RPM
ls -a