const config = require('../truffle');
const PublicUser = artifacts.require('./PublicUser.sol');
const PublicProject = artifacts.require('./PublicProject.sol');
const PrivateProject = artifacts.require('./PrivateProject.sol');
const PublicChallenge = artifacts.require('./PublicChallenge.sol');
const PublicChallengeReview = artifacts.require('./PublicChallengeReview.sol');
const PublicChallengeSubmission = artifacts.require('./PublicChallengeSubmission.sol');
const PublicChallengeAppeal = artifacts.require('./PublicChallengeAppeal.sol');
const PublicChallengeMember = artifacts.require('./PublicChallengeMember.sol');

module.exports = function (deployer) {
  return deployer.deploy(PublicUser).then(function () {
    return deployer.deploy(PublicProject, PublicUser.address).then(function () {
      return deployer.deploy(PrivateProject, PublicUser.address, {privateFor: config.networks.development.privateFor}).then(function () {
        return deployer.deploy(PublicChallenge, PublicUser.address).then(function () {
          return deployer.deploy(PublicChallengeSubmission, PublicUser.address).then(function () {
            return deployer.deploy(PublicChallengeReview, PublicUser.address).then(function () {
              return deployer.deploy(PublicChallengeAppeal, PublicUser.address).then(function () {
                return deployer.deploy(PublicChallengeMember, PublicUser.address).then(function () {
                });
              });
            });
          });
        });
      });
    });
  });
};
