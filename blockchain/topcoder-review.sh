#!/bin/bash

#
# Copyright (c) 2018 TopCoder, Inc. All rights reserved.
#
# author: TCSDEVELOPER
# version: 1.0
#

NODES="client topcoder member moderator"

# Print the usage message
function printHelp() {
  echo "Usage: "
  echo "  topcoder-review.sh <mode>"
  echo "    <mode> - one of 'up', 'down', 'generate'"
  echo "      - 'up' - bring up the network with docker-compose up"
  echo "      - 'down' - clear the network with docker-compose down"
  echo "      - 'generate' - generate required keys and other necessary files"
  echo "  topcoder-review.sh -h (print this message)"
  echo
  echo "Typically, one would first generate the required keys and files, then bring up the network. e.g.:"
  echo
  echo "	topcoder-review.sh generate"
  echo "	topcoder-review.sh up"
  echo "	topcoder-review.sh down"
}



# generates the data
generate() {
    rm -rf ./qdata
    for node in $NODES
    do
        mkdir -p ./qdata/$node/c
        mkdir -p ./qdata/$node/dd/keystore
        mkdir -p ./qdata/$node/dd/geth

        cp ./config/$node/tm.key ./qdata/$node/c
        cp ./config/$node/tm.pub ./qdata/$node/c
        cp ./config/$node/nodekey ./qdata/$node/dd/geth
        cp ./config/$node/key ./qdata/$node/dd/keystore

        cp ./config/genesis.json ./qdata/$node/
        cp ./config/passwords.txt ./qdata/$node/

        cp ./config/permissioned-nodes.json ./qdata/$node/dd/permissioned-nodes.json
        cp ./config/permissioned-nodes.json ./qdata/$node/dd/static-nodes.json
    done
}

# clear the data and the containers
clear() {
    CONTAINER_IDS=$(docker ps -a | awk '($2 ~ /quorum/) {print $1}')
    if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" == " " ]; then
        echo "---- No containers available for deletion ----"
    else
        docker rm -f $CONTAINER_IDS
    fi
    rm -rf ./qdata
    rm -rf ./ipfs_data
}

# shutdown the network
down() {
    docker-compose down
    clear
}

# setup the network
up() {
  if [ ! -d "./qdata" ]; then
    generate
  fi

  docker-compose up -d 2>&1
  if [ $? -ne 0 ]; then
    echo "ERROR !!!! Unable to start network"
    exit 1
  fi
}


MODE=$1
shift

while getopts "h?" opt; do
  case "$opt" in
  h | \?)
    printHelp
    exit 0
    ;;
  esac
done

#Create the network using docker compose
if [ "${MODE}" == "up" ]; then
  up
elif [ "${MODE}" == "down" ]; then ## Clear the network
  down
elif [ "${MODE}" == "generate" ]; then ## Generate Artifacts
  generate
else
  printHelp
  exit 1
fi



