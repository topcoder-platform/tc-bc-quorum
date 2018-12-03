# TopCoder - POC Quorum Challenge Review Process with Blockchain - Platform Setup

This is the deployment guide for TopCoder - POC Quorum Challenge Review Process with Blockchain - Platform Setup

## Prerequisites

1. Mac OSX or Linux
2. [Docker](https://www.docker.com/)
3. [Node.js v8+](https://nodejs.org/en/)
4. [Quorum v2.0.2](https://www.jpmorgan.com/global/Quorum)
5. [IPFS](https://ipfs.io/)
6. [Truffle](https://github.com/trufflesuite/truffle)

Note, all you need to do is just install and run docker in your local machine (Linux or Mac OSX).
and also installed node.js in your local machine.
Other prerequisites will be installed or running in docker containers.

## Build/Pull the Docker images

To build the Quorum docker image, in the submission root folder, run:
```
docker build . -t quorum
```

After this is done, you should see the docker image here:
```
docker images | grep quorum
```

To pull the IPFS docker image, run:
```
docker pull jbenet/go-ipfs
```

## Configuration (OPTIONAL)

In this challenge, you can use the default configuration in the submission to setup and tests without touching any configurations.
So you can skip the whole `configuration` section if you don't want to spend much time to read.

### Docker containers configuration

The docker containers configuration is file: `docker-compose.yaml`

This file defines several docker containers:

- topcoder-node - the quorum node for topcoder
- member-node - the quorum node for member
- client-node - the quorum node for client
- moderator-node - the quorum node for moderator
- ipfs-node - the ipfs service

If you wish, you can change the following configurations in the `docker-compose.yaml` file:

- change the subnet here:

```yaml
networks:
  topcoder_quorum_net:
    driver: bridge
    ipam:
      driver: default
      config:
      - subnet: 192.168.0.0/16 # changes the subnet here
```
- change the ip address for each node:
The configuration is in: `ipv4_address`

### blockchain configurations

The all blockchain configurations are in: `./config`

There are 4 node configs in:

- ./config/client
- ./config/topcoder
- ./config/moderator
- ./config/member


For each of the above folders there are 4 key files:

- key - the node account info
- nodekey - the node key for geth node
- tm.key - the private key for constellation
- tm.pub - the public key for constellation

I have generated the keys for you. but, if you want to re-generate these keys for your own, follow the following step:

#### Create a container to run the commands:
run:
```
docker run  -it  quorum /bin/bash
```
Then you are in a quorum node console.

#### Generate _key_ file
in the quorum node console:
run:
```
geth --datadir=. account new
```
You should see a `keystore` folder is generated, and the only file inside is the content of the `key` file you want.

#### Generate _nodekey_ file
in the quorum node console:
run:
```
bootnode -genkey=./nodekey
```
Then you can see the `nodekey` files is generated.
Then run
```
bootnode -nodekey=./nodekey -writeaddress
```
This will output the node's address. You should remember this address. it will used in the future steps.

#### Generate the _tm.key_ and _tm.pub_ files
```
constellation-node --generatekeys=./tm
```
Then you should see the `tm.key` and `tm.pub` files are generated.

#### Config the _genesis.json_
in the `config/genesis.json`, you can config the following properties:

- alloc: the topcoder, moderator, member, client account initial balance.
You can find each of the account address in the file: `./config/<node_name>/key`, the `address` property and added '0x' prefix to it.

#### Config the _passwords.txt_
You can leave it empty. If not, please make sure that the password here is the same as it is when you run the command:
```
geth --datadir=. account new
```
to generate _key_ file in the previous step.

#### Config the _permissioned-nodes.json_ file
there should be 4 lines representing the topcoder, member, moderator, client nodes, each line, the format is:
```
  enode://<NODE_ADDRESS>@<NODE_IP>:21000?discport=0&raftport=50401"
```

The _*NODE_ADDRESS*_ is the address output in the command of the previous step:
```
bootnode -nodekey=./nodekey -writeaddress
```
The _*NODE_IP*_ is the ip address you configure for the node in `docker-compose.yaml` file.


### Truffle configuration

Truffle is used for deploy the contracts only.
The truffle configuration is in `./truffle.js`

- networks.development.from - the coinbase address of the node that you want to deploy the contracts.
- networks.development.privateFor - the node that your private contract between the deployed node and the privateFor nodes.



## Start/Stop the topcoder-review network

The script: `topcoder-review.sh` is used to manager the quorum/ipfs network. Try to run the following commands:
```
./topcoder-review.sh generate
```
> This command copies the keys and other necessary files for each node.


```
./topcoder-review.sh up
```
> This command will start the docker containers for topcoder, member, moderator, client, ipfs


```
./topcoder-review.sh down
```
> This command do the following things for you:
1). Stops all the related docker containers.
2). Clear the auto-generated data in your local machine.

## Deploy the contracts
First make sure the truffle is installed, if not run:
```
npm install -g truffle
```

To deploy the contracts, run:
```
truffle migrate --reset
```

## Conclusion

To conclude, to start the whole service and deploy the contracts, you just need to run the following commands:
```
./topcoder-review.sh generate
./topcoder-review.sh up
```

Wait for the nodes starts, then deploy the contract by running:
```
truffle migrate --reset
```

To stop and clear the data:
```
./topcoder-review.sh down
```



