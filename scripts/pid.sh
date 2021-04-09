#! /bin/bash
if [ $# -lt 1 ]; then
  echo "Please provide a port number parameter for this script"
  echo "e.g. $0 8080"
  exit
fi

hex_port=$(printf "%x" "$1")
inode=$(grep ":${hex_port^^}" /proc/net/tcp | awk '{print $10}')

for i in $(ps axo pid); do
  ls -l /proc/"$i"/fd 2>/dev/null | grep -q ":\[$inode\]" && echo "$i"
done
