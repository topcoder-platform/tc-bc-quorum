#!/bin/bash
rm -rf ./config/quorum
mkdir -p ./config/quorum
cp -r ../blockchain/build/contracts ./config/quorum
rm ./config/quorum/contracts/Migrations.json