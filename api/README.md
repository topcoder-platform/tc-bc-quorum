# Topcoder - PoC Challenge Review Process with Blockchain - Rest API Setup

This is the deployment guide for PoC Challenge Review Process with Blockchain - Rest API Setup

## Prerequisites

1. Mac OSX or Linux
3. [Node.js v8+](https://nodejs.org/en/)
4. [Quorum v2.0.2](https://www.jpmorgan.com/global/Quorum)

Make sure the Fabric blockchain network has been setup and the contracts are deployed before setting up this API.

## Configuration

In this challenge, you can use the default configuration in the submission to setup and tests without touching any configurations.
So you can skip the whole `configuration` section if you don't want to spend much time to read.

### Rest API Configurations

The app's configuration is in: [./config/default.js](./config/default.js)

- PORT - the listening port of this api
- logLevel - the logging level
- version - the api version to construct the entrypoint of the api, like: /api/${version}
- fileUploadTMPDirectory - temporarily stores the uploaded multipart/form-data files.
- ipfs - the ipfs configurations
- quorum - contains the node informations of the quorum network

Also, some of the configurations can be set via environment variables, see:
[./config/default.js](./config/custom-environment-variables.js)



## Build and Run

Install the dependecies, run:
```
npm install
```

Copy the eth contract artifacts, run:
```
./copy-config.sh
```
This script will copy the contract artifacts to `./config/quorum/contracts`.



To serve the api, run:
```
npm start
```

The api entry point now should be:
```
http://localhost:3010/api/v1
```

## Verification
View [Validation.md](./Validation.md) for details.



