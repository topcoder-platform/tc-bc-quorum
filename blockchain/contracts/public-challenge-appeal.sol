pragma solidity ^0.4.24;
import "./public-user.sol";
contract PublicChallengeAppeal {
    PublicUser publicUserContract;

    struct Appeal {
        string reviewerId;
        string memberId;
        uint question;
        string text;
    }

    struct AppealResponse {
        string reviewerId;
        string memberId;
        uint question;
        string text;
        uint finalScore;
    }


    mapping(string => Appeal[]) challengeAppeals;
    mapping(string => AppealResponse[]) challengeAppealResponses;

    constructor(address publicUserContractAddress) public {
        publicUserContract = PublicUser(publicUserContractAddress);
    }

    function createAppeal(string challengeId, string reviewerId, string memberId, uint question, string text) public {
        Appeal[] storage appeals = challengeAppeals[challengeId];
        appeals.length++;
        appeals[appeals.length - 1].reviewerId = reviewerId;
        appeals[appeals.length - 1].memberId = memberId;
        appeals[appeals.length - 1].question = question;
        appeals[appeals.length - 1].text = text;
    }

    function getAppealsCount(string challengeId) public view returns (uint) {
        Appeal[] memory appeals = challengeAppeals[challengeId];
        return appeals.length;
    }

    function getAppeal(string challengeId, uint index) public view returns (string, string, uint, string) {
        Appeal memory appeal = challengeAppeals[challengeId][index];
        return (appeal.reviewerId, appeal.memberId, appeal.question, appeal.text);
    }


    function createAppealResponse(string challengeId, string reviewerId, string memberId, uint question, string text, uint finalScore) public {
        AppealResponse[] storage appealResponses = challengeAppealResponses[challengeId];
        appealResponses.length++;
        appealResponses[appealResponses.length - 1].reviewerId = reviewerId;
        appealResponses[appealResponses.length - 1].memberId = memberId;
        appealResponses[appealResponses.length - 1].question = question;
        appealResponses[appealResponses.length - 1].text = text;
        appealResponses[appealResponses.length - 1].finalScore = finalScore;
    }

    function getAppealResponsesCount(string challengeId) public view returns (uint) {
        AppealResponse[] memory appealResponses = challengeAppealResponses[challengeId];
        return appealResponses.length;
    }

    function getAppealResponse(string challengeId, uint index) public view returns (string, string, uint, string, uint) {
        AppealResponse memory appealResponse = challengeAppealResponses[challengeId][index];
        return (appealResponse.reviewerId, appealResponse.memberId, appealResponse.question, appealResponse.text, appealResponse.finalScore);
    }

}