pragma solidity ^0.4.24;

import "./public-user.sol";

contract PublicProject {
    PublicUser publicUserContract;
    struct Index {
        uint index;
        bool isValue;
    }

    struct Project {
        string projectId;
        string clientId;
        string copilotId;
        string name;
        string description;
        string status;
        string createdBy;
        string updatedBy;
    }

    Project[] projects;

    modifier onlyRole(string role) {
        string memory memberRole = publicUserContract.getRoleFromAddress(msg.sender);
        require(keccak256(bytes(memberRole)) == keccak256(bytes(role)));
        _;
    }

    modifier only2Roles(string role1, string role2) {
        string memory memberRole = publicUserContract.getRoleFromAddress(msg.sender);
        require(
            keccak256(bytes(memberRole)) == keccak256(bytes(role1))
            || keccak256(bytes(memberRole)) == keccak256(bytes(role2))
        );
        _;
    }

    modifier only3Roles(string role1, string role2, string role3) {
        string memory memberRole = publicUserContract.getRoleFromAddress(msg.sender);
        require(
            keccak256(bytes(memberRole)) == keccak256(bytes(role1))
            || keccak256(bytes(memberRole)) == keccak256(bytes(role2))
            || keccak256(bytes(memberRole)) == keccak256(bytes(role3))
        );
        _;
    }


    mapping(string => Index) idToProjectIndex;


    /**
     * Initializations
     */
    constructor(address publicUserContractAddress) public {
        publicUserContract = PublicUser(publicUserContractAddress);
    }


    function createProject(string projectId, string clientId, string copilotId,
        string name, string description, string status, string createdBy, string updatedBy) public only2Roles("manager", "client") {
        projects.length++;
        uint currentIndex = projects.length - 1;
        projects[currentIndex].projectId = projectId;
        projects[currentIndex].clientId = clientId;
        projects[currentIndex].copilotId = copilotId;
        projects[currentIndex].name = name;
        projects[currentIndex].description = description;
        projects[currentIndex].status = status;
        projects[currentIndex].createdBy = createdBy;
        projects[currentIndex].updatedBy = updatedBy;

        idToProjectIndex[projectId] = Index(currentIndex, true);

    }

    function updateProject(string projectId, string clientId, string copilotId,
        string name, string description, string status, string createdBy, string updatedBy) public onlyRole("manager") {

        Index memory ind = idToProjectIndex[projectId];
        require(ind.isValue);

        Project storage project = projects[ind.index];

        project.projectId = projectId;
        project.clientId = clientId;
        project.copilotId = copilotId;
        project.name = name;
        project.description = description;
        project.status = status;
        project.createdBy = createdBy;
        project.updatedBy = updatedBy;
    }


    function getProjectsCount() public view only3Roles("manager", "client", "copilot") returns (uint) {
        return projects.length;
    }


    function getProjectPart1(uint index) public view returns (string, string, string, string, string) {
        Project memory project = projects[index];
        return flattenProjectPart1(project);
    }

    function getProjectPart2(uint index) public view returns (string, string, string) {
        Project memory project = projects[index];
        return flattenProjectPart2(project);
    }

    function getProjectByIdPart1(string id) public view returns (string, string, string, string, string) {
        Project memory project = getProjectFromIdMap(id);
        return flattenProjectPart1(project);
    }

    function getProjectByIdPart2(string id) public view returns (string, string, string) {
        Project memory project = getProjectFromIdMap(id);
        return flattenProjectPart2(project);
    }


    function flattenProjectPart1(Project project) private pure returns (string, string, string, string, string) {
        return (project.projectId, project.clientId, project.copilotId, project.name, project.description);
    }

    function flattenProjectPart2(Project project) private pure returns (string, string, string) {
        return (project.status, project.createdBy, project.updatedBy);
    }

    function getProjectFromIdMap(string key) private view returns (Project memory) {
        Index memory ind = idToProjectIndex[key];
        if (!ind.isValue) {
            Project memory project;
            return project;
        }
        return projects[ind.index];
    }


}