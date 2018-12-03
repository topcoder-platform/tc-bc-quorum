// challenge.challengeId, challenge.projectId, challenge.name, challenge.description, challenge.currentPhase);
// (challenge.winnerPrizes, challenge.reviewerPrize, challenge.copilotPrize, challenge.createdBy, challenge.updatedBy);
const _ = require('lodash');

const columns = [
  {name: 'challengeId'},
  {name: 'projectId'},
  {name: 'name'},
  {name: 'description'},
  {name: 'currentPhase'},
  {name: 'winnerPrizes'},
  {name: 'reviewerPrize'},
  {name: 'copilotPrize'},
  {name: 'createdBy'},
  {name: 'updatedBy'},
];

const groups = {
  Part1: ['challengeId', 'projectId', 'name', 'description', 'currentPhase'],
  Part2: ['winnerPrizes', 'reviewerPrize', 'copilotPrize', 'createdBy', 'updatedBy']
};

const toJSON = (obj) => {
  obj.prizes = {
    winners: _.map(obj.winnerPrizes, p => Number(p)),
    reviewer: _.isNil(obj.reviewerPrize) ? null : Number(obj.reviewerPrize),
    copilot: _.isNil(obj.copilotPrize) ? null : Number(obj.copilotPrize)
  };
  delete obj.winnerPrizes;
  delete obj.reviewerPrize;
  delete obj.copilotPrize;
  return obj;
};

const flatten = (obj, current) => {
  if (obj.prizes) {
    if (obj.prizes.winners) {
      current[5] = obj.prizes.winners;
    }
    if (!_.isNil(obj.prizes.reviewer)) {
      current[6] = obj.prizes.reviewer;
    }
    if (!_.isNil(obj.prizes.copilot)) {
      current[7] = obj.prizes.copilot;
    }
  }
};

module.exports = {
  columns,
  groups,
  id: 'challengeId',
  toJSON,
  flatten
};