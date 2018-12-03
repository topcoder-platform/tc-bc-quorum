pragma solidity ^0.4.24;
import "./public-user.sol";
contract PublicChallengeSubmission {
    PublicUser publicUserContract;

    struct Submission {
        string submissionId;
        string challengeId;
        string memberId;
        string originalFileName;
        string fileName;
        string ipfsHash;
        int64 timestamp;
    }

    mapping(string => Submission[]) challengeSubmissions;


    constructor(address publicUserContractAddress) public {
        publicUserContract = PublicUser(publicUserContractAddress);
    }



    function uploadSubmission(string submissionId, string challengeId, string memberId, string originalFileName,
        string fileName, string ipfsHash, int64 timestamp)  public {
        Submission[] storage submissions = challengeSubmissions[challengeId];
        bool found = false;
        for (uint i = 0; i < submissions.length; i++) {
            Submission storage submission = submissions[i];
            if (keccak256(bytes(submission.submissionId)) == keccak256(bytes(submissionId))) {
                // update
                found = true;
                submission.submissionId = submissionId;
                submission.challengeId = challengeId;
                submission.memberId = memberId;
                submission.originalFileName = originalFileName;
                submission.fileName = fileName;
                submission.ipfsHash = ipfsHash;
                submission.timestamp = timestamp;
            }
        }
        if (!found) {
            submissions.push(Submission(submissionId, challengeId, memberId, originalFileName, fileName, ipfsHash, timestamp));
        }
    }



    function getSubmissionsCount(string challengeId) public view returns (uint) {
        return challengeSubmissions[challengeId].length;
    }

    function getSubmissionPart1(string challengeId, uint index) public view returns (string, string, string, string) {
        Submission memory submission = challengeSubmissions[challengeId][index];
        return (submission.submissionId, submission.challengeId, submission.memberId, submission.originalFileName);
    }

    function getSubmissionPart2(string challengeId, uint index) public view returns (string, string, int64) {
        Submission memory submission = challengeSubmissions[challengeId][index];
        return (submission.fileName, submission.ipfsHash, submission.timestamp);
    }

    function getSubmissionByIdPart1(string challengeId, string submissionId) public view returns (string, string, string, string) {
        Submission memory submission = findSubmission(challengeId, submissionId);
        return (submission.submissionId, submission.challengeId, submission.memberId, submission.originalFileName);
    }

    function getSubmissionByIdPart2(string challengeId, string submissionId) public view returns (string, string, int64) {
        Submission memory submission = findSubmission(challengeId, submissionId);
        return (submission.fileName, submission.ipfsHash, submission.timestamp);
    }

    function findSubmission(string challengeId, string submissionId) private view returns (Submission memory) {
        Submission[] storage submissions = challengeSubmissions[challengeId];
        for (uint i = 0; i < submissions.length; i++) {
            Submission memory submission = submissions[i];
            if (keccak256(bytes(submission.submissionId)) == keccak256(bytes(submissionId))) {
                return submission;
            }
        }
        Submission memory dummy;
        return dummy;
    }


}