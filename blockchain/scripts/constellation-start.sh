#!/bin/bash

#
# Copyright (c) 2018 TopCoder, Inc. All rights reserved.
#
# author: TCSDEVELOPER
# version: 1.0
#

set -u
set -e

DDIR="./qdata/c"

mkdir -p ./qdata/logs

rm -f "$DDIR/tm.ipc"
CMD="constellation-node --url=https://$NODE_HOST_NAME:9001/ --port=9001 --workdir=$DDIR --socket=tm.ipc --publickeys=tm.pub --privatekeys=tm.key --othernodes=https://topcoder-node:9001/"
echo "$CMD >> ./qdata/logs/constellation.log 2>&1 &"
$CMD >> "./qdata/logs/constellation.log" 2>&1 &

DOWN=true
while $DOWN; do
    sleep 0.1
    DOWN=false
	if [ ! -S "$DDIR/tm.ipc" ]; then
        DOWN=true
	fi
done
