pragma solidity ^0.4.24;

import "./public-user.sol";

contract PublicChallenge {

    PublicUser publicUserContract;

    struct Index {
        uint index;
        bool isValue;
    }


    struct ChallengePhase {
        string name;
        int64 startDate;
        int64 endDate;
    }

    struct Challenge {
        string challengeId;
        string projectId;
        string name;
        string description;
        string currentPhase;
        uint[] winnerPrizes;
        uint reviewerPrize;
        uint copilotPrize;
        string createdBy;
        string updatedBy;
    }


    Challenge[] challenges;


    mapping(string => Index) idToChallengeIndex;

    mapping(string => ChallengePhase[]) challengePhases;


    /**
     * Initializations
     */
    constructor(address publicUserContractAddress) public {
        // does nothing
        publicUserContract = PublicUser(publicUserContractAddress);
    }

    function createChallenge(string challengeId,
                             string projectId,
                             string name,
                             string description,
                             string currentPhase,
                             uint[] winnerPrizes,
                             uint reviewerPrize,
                             uint copilotPrize,
                             string createdBy,
                             string updatedBy) public {
        challenges.length++;
        uint currentIndex = challenges.length - 1;
        challenges[currentIndex].challengeId = challengeId;
        challenges[currentIndex].projectId = projectId;
        challenges[currentIndex].name = name;
        challenges[currentIndex].description = description;
        challenges[currentIndex].currentPhase = currentPhase;
        challenges[currentIndex].winnerPrizes = winnerPrizes;
        challenges[currentIndex].reviewerPrize = reviewerPrize;
        challenges[currentIndex].copilotPrize = copilotPrize;
        challenges[currentIndex].createdBy = createdBy;
        challenges[currentIndex].updatedBy = updatedBy;

        idToChallengeIndex[challengeId] = Index(currentIndex, true);

    }

    function updateChallenge(string challengeId,
        string projectId,
        string name,
        string description,
        string currentPhase,
        uint[] winnerPrizes,
        uint reviewerPrize,
        uint copilotPrize,
        string createdBy,
        string updatedBy) public {

        Index memory ind = idToChallengeIndex[challengeId];
        require(ind.isValue);

        Challenge storage challenge = challenges[ind.index];

        challenge.projectId = projectId;
        challenge.projectId = projectId;
        challenge.name = name;
        challenge.description = description;
        challenge.winnerPrizes = winnerPrizes;
        challenge.reviewerPrize = reviewerPrize;
        challenge.copilotPrize = copilotPrize;
        challenge.currentPhase = currentPhase;
        challenge.createdBy = createdBy;
        challenge.updatedBy = updatedBy;
    }

    function addChallengePhase(string challengeId, uint phaseIndex, string name, int64 startDate, int64 endDate) public {
        ChallengePhase[] storage phases = challengePhases[challengeId];
        if (phaseIndex == 0) {
            phases.length = 0;
        }
        phases.length++;
        uint currentIndex = phases.length - 1;
        phases[currentIndex].name = name;
        phases[currentIndex].startDate = startDate;
        phases[currentIndex].endDate = endDate;
    }

    function getPhasesCount(string challengeId) public view returns (uint) {
        ChallengePhase[] memory phases = challengePhases[challengeId];
        return phases.length;
    }

    function getChallengesCount() public view returns (uint) {
        return challenges.length;
    }


    function getPhase(string challengeId, uint index) public view returns (string, int64, int64) {
        ChallengePhase[] memory phases = challengePhases[challengeId];
        ChallengePhase memory phase = phases[index];
        return (phase.name, phase.startDate, phase.endDate);
    }


    function getChallengePart1(uint index) public view returns (string, string, string, string, string) {
        Challenge memory challenge = challenges[index];
        return flattenChallengePart1(challenge);
    }

    function getChallengePart2(uint index) public view returns (uint[], uint, uint, string, string) {
        Challenge memory challenge = challenges[index];
        return flattenChallengePart2(challenge);
    }

    function getChallengeByIdPart1(string id) public view returns (string, string, string, string, string) {
        Challenge memory challenge = getChallengeFromIdMap(id);
        return flattenChallengePart1(challenge);
    }

    function getChallengeByIdPart2(string id) public view returns (uint[], uint, uint, string, string) {
        Challenge memory challenge = getChallengeFromIdMap(id);
        return flattenChallengePart2(challenge);
    }



    function flattenChallengePart1(Challenge challenge) private pure returns (string, string, string, string, string) {
        return (challenge.challengeId, challenge.projectId, challenge.name, challenge.description, challenge.currentPhase);
    }

    function flattenChallengePart2(Challenge challenge) private pure returns (uint[], uint, uint, string, string) {
        return (challenge.winnerPrizes, challenge.reviewerPrize, challenge.copilotPrize, challenge.createdBy, challenge.updatedBy);
    }

    function getChallengeFromIdMap(string key) private view returns (Challenge memory) {
        Index memory ind = idToChallengeIndex[key];
        if (!ind.isValue) {
            Challenge memory challenge;
            return challenge;
        }
        return challenges[ind.index];
    }


    function getOnGoingChallengesCount() public view returns (uint) {
        uint c = 0;
        string memory completedStatus = "Completed";
        for (uint i = 0; i < challenges.length; i++) {
            Challenge memory challenge = challenges[i];
            if (keccak256(bytes(challenge.currentPhase)) != keccak256(bytes(completedStatus))) {
                c++;
            }
        }
        return c;
    }

    function getOnGoingChallenge(uint index) public view returns (string) {
        uint c = 0;
        string memory completedStatus = "Completed";
        for (uint i = 0; i < challenges.length; i++) {
            Challenge memory challenge = challenges[i];
            if (keccak256(bytes(challenge.currentPhase)) != keccak256(bytes(completedStatus))) {
                if (c == index) {
                    return challenge.challengeId;
                }
                c++;
            }
        }
        return "";
    }


}