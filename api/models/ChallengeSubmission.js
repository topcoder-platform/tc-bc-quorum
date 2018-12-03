/*
(string submissionId, string challengeId, string memberId, string originalFileName,
        string fileName, string ipfsHash, int64 timestamp)
 */
const _ = require('lodash');

const columns = [
  {name: 'submissionId'},
  {name: 'challengeId'},
  {name: 'memberId'},
  {name: 'originalFileName'},
  {name: 'fileName'},
  {name: 'ipfsHash'},
  {name: 'timestamp'}
];

const groups = {
  Part1: ['submissionId', 'challengeId', 'memberId', 'originalFileName'],
  Part2: ['fileName', 'ipfsHash', 'timestamp']
};

const toJSON = (obj) => {
  obj.timestamp = new Date(Number(obj.timestamp));
  return obj;
};

const flatten = (obj, current) => {
  current[6] = new Date(obj.timestamp).getTime();
};

module.exports = {
  columns,
  groups,
  id: 'submissionId',
  toJSON,
  flatten
};