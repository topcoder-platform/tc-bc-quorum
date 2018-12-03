/**
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */
const path = require('path');
/**
 * This file is the configurations of the rest-api application.
 * @author TCSDEVELOPER
 * @version 1.0
 */
module.exports = {
  contractArtifactsPath: path.join(__dirname, 'quorum', 'contracts'),
  ethAccountPassword: 'TopCoder123',
  port: 3010,
  logLevel: "debug",
  version: "v1",
  jwtSecret: 'mysecret',
  fileUploadTMPDirectory: '/tmp/topcoder-upload',
  tokenExpires: 86400 * 365, // 365 days
  phaseCheckInterval: 10, // every 10 seconds
  ipfs: {
    host: 'localhost',
    port: '5001',
    protocol: 'http'
  },
  quorum: {
    topcoder: {
      url: 'http://localhost:22000',
      coinbase: '0x9186eb3d20cbd1f5f992a950d808c4495153abd5',
      nodeKey: 'oNspPPgszVUFw0qmGFfWwh1uxVUXgvBxleXORHj07g8='
    },
    client: {
      url: 'http://localhost:22001',
      nodeKey: 'BULeR8JyUWhiuuCMU/HLA0Q5pzkYT+cHII3ZKBey3Bo='
    },
    moderator: {
      url: 'http://localhost:22002',
      nodeKey: '1iTZde/ndBHvzhcl7V68x44Vx7pl8nwx9LqnM/AfJUg='
    },
    member: {
      url: 'http://localhost:22003',
      nodeKey: 'QfeDAys9MPDs2XHExtc84jKGHxZg/aj52DTh0vtA3Xc='
    }
  }
};
