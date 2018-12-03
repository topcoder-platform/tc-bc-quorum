pragma solidity ^0.4.24;
import "./public-user.sol";
contract PublicChallengeReview {

    PublicUser publicUserContract;



    struct ScorecardQuestion {
        string text;
        uint weight;
        uint order;
    }

    struct Scorecard {
        string name;
        ScorecardQuestion[] questions;
    }

    struct ReviewItem {
        uint question;
        uint score;
        string comments;
    }

    struct Review {
        string reviewerId;
        string memberId;
        ReviewItem[] reviews;
    }


    mapping(string => Scorecard) challengeScorecard;
    mapping(string => Review[]) challengeReviews;
    mapping(string => string[]) challengeReviewers;

    modifier only2Roles(string role1, string role2) {
        string memory memberRole = publicUserContract.getRoleFromAddress(msg.sender);
        require(
            keccak256(bytes(memberRole)) == keccak256(bytes(role1))
            || keccak256(bytes(memberRole)) == keccak256(bytes(role2))
        );
        _;
    }

    constructor(address publicUserContractAddress) public {
        publicUserContract = PublicUser(publicUserContractAddress);
    }


    function createScorecard(string challengeId, string name) public only2Roles("manager", "copilot") {
        Scorecard storage scorecard = challengeScorecard[challengeId];
        scorecard.name = name;
        scorecard.questions.length = 0;
    }

    function getScorecard(string challengeId) public view returns (string) {
        Scorecard memory scorecard = challengeScorecard[challengeId];
        return (scorecard.name);
    }

    function addScorecardQuestion(string challengeId, string text, uint weight, uint order) public {
        Scorecard storage scorecard = challengeScorecard[challengeId];
        scorecard.questions.length++;
        scorecard.questions[scorecard.questions.length - 1] = ScorecardQuestion(text, weight, order);

    }

    function getScorecardQuestionsCount(string challengeId) public view returns (uint) {
        Scorecard memory scorecard = challengeScorecard[challengeId];
        return scorecard.questions.length;
    }

    function getScorecardQuestion(string challengeId, uint index) public view returns (string text, uint weight, uint order) {
        Scorecard memory scorecard = challengeScorecard[challengeId];
        ScorecardQuestion memory question = scorecard.questions[index];
        return (question.text, question.weight, question.order);
    }

    function createReview(string challengeId, string reviewerId, string memberId) public {
        Review[] storage reviews = challengeReviews[challengeId];
        reviews.length++;
        reviews[reviews.length - 1].reviewerId = reviewerId;
        reviews[reviews.length - 1].memberId = memberId;
    }

    function addReviewItem(string challengeId, string reviewerId, string memberId, uint question, uint score, string comments) public {
        Review[] storage reviews = challengeReviews[challengeId];
        for (uint i = 0; i < reviews.length; i++) {
            Review storage review = reviews[i];
            if (keccak256(bytes(review.reviewerId)) != keccak256(bytes(reviewerId))
            || keccak256(bytes(review.memberId)) != keccak256(bytes(memberId))) {
                continue;
            }
            review.reviews.push(ReviewItem(question, score, comments));
        }
    }

    function getReviewsCount(string challengeId) public view returns (uint) {
        Review[] memory reviews = challengeReviews[challengeId];
        return reviews.length;
    }

    function getReview(string challengeId, uint index) public view returns (string, string) {
        Review memory review = challengeReviews[challengeId][index];
        return (review.reviewerId, review.memberId);
    }

    function getReviewItemsCount(string challengeId, string reviewerId, string memberId) public view returns (uint) {
        Review[] memory reviews = challengeReviews[challengeId];
        for (uint i = 0; i < reviews.length; i++) {
            Review memory review = reviews[i];
            if (keccak256(bytes(review.reviewerId)) != keccak256(bytes(reviewerId))
            || keccak256(bytes(review.memberId)) != keccak256(bytes(memberId))) {
                continue;
            }
            return review.reviews.length;
        }
        return 0;
    }

    function getReviewItem(string challengeId, string reviewerId, string memberId, uint index) public view returns (uint, uint, string) {
        Review[] memory reviews = challengeReviews[challengeId];
        for (uint i = 0; i < reviews.length; i++) {
            Review memory review = reviews[i];
            if (keccak256(bytes(review.reviewerId)) != keccak256(bytes(reviewerId))
            || keccak256(bytes(review.memberId)) != keccak256(bytes(memberId))) {
                continue;
            }
            ReviewItem memory reviewItem = review.reviews[index];
            return (reviewItem.question, reviewItem.score, reviewItem.comments);
        }
        return (0, 0, "");
    }


    function getReviewersCount(string challengeId) public view returns (uint) {
        return challengeReviewers[challengeId].length;
    }

    function getReviewer(string challengeId, uint index) public view returns (string) {
        string memory reviewer = challengeReviewers[challengeId][index];
        return (reviewer);
    }

    function registerReviewer(string challengeId, string reviewerId) public only2Roles("manager", "copilot") {
        string [] storage reviewers = challengeReviewers[challengeId];
        // check if the reviewer exists
        bool found = false;
        for (uint i = 0; i < reviewers.length; i++) {
            if (keccak256(bytes(reviewers[i])) == keccak256(bytes(reviewerId))) {
                found = true;
                break;
            }
        }
        if (!found) {
            reviewers.push(reviewerId);
        }
    }

    function unregisterReviewer(string challengeId, string reviewerId) public only2Roles("manager", "copilot") {
        string [] storage reviewers = challengeReviewers[challengeId];
        // check if the reviewer exists
        bool found = false;
        uint index = 0;
        uint i = 0;
        for (i = 0; i < reviewers.length; i++) {
            if (keccak256(bytes(reviewers[i])) == keccak256(bytes(reviewerId))) {
                found = true;
                index = i;
                break;
            }
        }
        if (found) {
            // remove from the reviewers array
            for (i = index; i < reviewers.length - 1; i++) {
                reviewers[i] = reviewers[i + 1];
            }
            delete reviewers[reviewers.length - 1];
            reviewers.length--;
        }
    }
}