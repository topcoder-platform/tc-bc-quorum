pragma solidity ^0.4.24;

contract PublicUser {

    struct Index {
        uint index;
        bool isValue;
    }

    struct User {
        string memberId;
        string memberEmail;
        string role;
        address memberAddress;
    }

    User[] users;

    mapping(address => Index) addressToUserIndex;
    mapping(string => Index) emailToUserIndex;
    mapping(string => Index) idToUserIndex;


    /**
     * Initializations
     */
    constructor() public {
        // does nothing
    }

    function createUser(string memberId, string memberEmail, string role, address memberAddress) public {
        require(bytes(role).length != 0, "role is required");

        users.length++;
        users[users.length - 1].memberId = memberId;
        users[users.length - 1].memberEmail = memberEmail;
        users[users.length - 1].role = role;
        users[users.length - 1].memberAddress = memberAddress;

        // set the mappings
        addressToUserIndex[memberAddress] = Index(users.length - 1, true);
        emailToUserIndex[memberEmail] = Index(users.length - 1, true);
        idToUserIndex[memberId] = Index(users.length - 1, true);
    }



    /**
     * Gets the total number of the submissions.
     */
    function getUsersCount() public view returns (uint) {
        return users.length;
    }


    /**
     * Gets a submission by index.
     */
    function getUser(uint index) public view returns (string, string, string, address) {
        User memory user = users[index];
        return flattenUser(user);
    }


    function getUserById(string id) public view returns (string, string, string, address) {
        User memory user = getUserFromIdMap(id);
        return flattenUser(user);
    }



    function getUserByEmail(string email) public view returns (string, string, string, address) {
        User memory user = getUserFromEmailMap(email);
        return flattenUser(user);
    }

    function flattenUser(User user) private pure returns (string, string, string, address) {
        return (user.memberId, user.memberEmail, user.role, user.memberAddress);
    }




    function getUserFromAddressMap(address key) private view returns (User memory) {
        Index memory ind = addressToUserIndex[key];
        if (!ind.isValue) {
            // not exists, return a empty user
            User memory user;
            return user;
        }
        return users[ind.index];
    }


    function getUserFromEmailMap(string key) private view returns (User memory) {
        Index memory ind = emailToUserIndex[key];
        if (!ind.isValue) {
            // not exists, return a empty user
            User memory user;
            return user;
        }
        return users[ind.index];
    }


    function getUserFromIdMap(string key) private view returns (User memory) {
        Index memory ind = idToUserIndex[key];
        if (!ind.isValue) {
            // not exists, return a empty user
            User memory user;
            return user;
        }
        return users[ind.index];
    }

    function getMemberIdFromAddress(address key) public view returns (string memory) {
        Index memory ind = addressToUserIndex[key];
        if (!ind.isValue) {
            // not exists, return a empty user
            string memory result;
            return result;
        }
        return users[ind.index].memberId;
    }

    function getRoleFromAddress(address key) public view returns (string memory) {
        Index memory ind = addressToUserIndex[key];
        if (!ind.isValue) {
            // not exists, return a empty user
            string memory result;
            return result;
        }
        return users[ind.index].role;
    }

}