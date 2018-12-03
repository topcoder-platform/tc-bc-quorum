pragma solidity ^0.4.24;

import "./public-user.sol";

contract PublicChallengeMember {

    PublicUser publicUserContract;


    struct Member {
        string id;
        uint status;
    }


    mapping(string => Member[]) challengeMembers;

    /**
     * Initializations
     */
    constructor(address publicUserContractAddress) public {
        // does nothing
        publicUserContract = PublicUser(publicUserContractAddress);
    }



    function registerChallenge(string challengeId) public {
        updateRegisterStatus(challengeId, 1);
    }


    function unregisterChallenge(string challengeId) public {
        updateRegisterStatus(challengeId, 0);
    }

    function updateRegisterStatus(string challengeId, uint status) private {
        string memory memberId = publicUserContract.getMemberIdFromAddress(msg.sender);
        Member[] storage members = challengeMembers[challengeId];
        bool found = false;
        for (uint i = 0; i < members.length; i++) {
            Member storage member = members[i];
            if (keccak256(bytes(member.id)) == keccak256(bytes(memberId))) {
                member.status = status;
                found = true;
                break;
            }
        }
        if (!found) {
            members.push(Member(memberId, status));
        }
    }



    function getMembersCount(string challengeId) public view returns (uint) {
        return challengeMembers[challengeId].length;
    }

    function getMember(string challengeId, uint index) public view returns (string, uint) {
        Member memory member = challengeMembers[challengeId][index];
        return (member.id, member.status);
    }




}