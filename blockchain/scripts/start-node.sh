#!/bin/bash

#
# Copyright (c) 2018 TopCoder, Inc. All rights reserved.
#
# author: TCSDEVELOPER
# version: 1.0
#

./scripts/constellation-start.sh

NETWORK_ID=$(cat ./qdata/genesis.json | grep chainId | awk -F " " '{print $2}' | awk -F "," '{print $1}')

if [ $NETWORK_ID -eq 1 ]
then
	echo "  Quorum should not be run with a chainId of 1 (Ethereum mainnet)"
    echo "  please set the chainId in the genensis.json to another value "
	echo "  1337 is the recommend ChainId for Geth private clients."
fi


geth --datadir ./qdata/dd init ./qdata/genesis.json

echo "[*] Starting Ethereum nodes with ChainID and NetworkId of $NETWORK_ID"
set -v
ARGS="--nodiscover --verbosity 5 --networkid $NETWORK_ID --raft --rpc --rpcaddr 0.0.0.0 --rpcapi admin,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,raft"
PRIVATE_CONFIG=./qdata/c/tm.ipc nohup geth --datadir ./qdata/dd $ARGS --permissioned --raftport 50401 --rpcport 8545 --port 21000 --unlock 0 --password ./qdata/passwords.txt 2>>./qdata/logs/geth.log

set +v


