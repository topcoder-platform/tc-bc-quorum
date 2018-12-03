const QuorumClient = require('../utils/QuorumClient');
const Consts = require('../utils/consts');
const fs = require('fs');
const config = require('config');
const Web3 = require("web3");
const path = require('path');

const web3s = {};
const contractArtifactCache = {};

const role2Node = {
  manager: 'topcoder',
  member: 'member',
  client: 'client',
  reviewer: 'moderator',
  copilot: 'moderator'
};

const loadContractArtifact = (file) => {
  if (contractArtifactCache[file]) {
    return contractArtifactCache[file];
  }
  const fileObj = JSON.parse(fs.readFileSync(file, 'utf8'));

  const result = {
    abi: fileObj.abi,
    address: fileObj.networks[Object.keys(fileObj.networks)[0]].address
  };
  contractArtifactCache[file] = result;
  return result;
};

const getWeb3ByRole = (role) => {
  if (web3s[role]) {
    return web3s[role];
  }
  const web3 = new Web3();
  const node = role2Node[role];
  web3.setProvider(new Web3.providers.HttpProvider(config.quorum[node].url));
  web3s[role] = web3;
  return web3;
};


const getAllContracts = (web3) => {
  const result = {};
  for (let contractType in Consts.ContractType) {
    const contractInfo = loadContractArtifact(path.join(config.contractArtifactsPath, `${contractType}.json`));
    result[contractType] = new web3.eth.Contract(contractInfo.abi, contractInfo.address);
  }
  return result;
};


const getQuorumClient = async (user) => {
  const web3 = getWeb3ByRole(user.role);
  // unlock the account
  await web3.eth.personal.unlockAccount(user.memberAddress, config.ethAccountPassword, null);
  return new QuorumClient(getAllContracts(web3), user.memberAddress);
};

const getSystemQuorumClient = async () => {
  const web3 = getWeb3ByRole('manager');
  return new QuorumClient(getAllContracts(web3), config.quorum.topcoder.coinbase);
};

const createEthAccount = async (role) => {
  const web3 = getWeb3ByRole(role);
  return await web3.eth.personal.newAccount(config.ethAccountPassword);
};

module.exports = {
  getQuorumClient,
  getSystemQuorumClient,
  createEthAccount
};