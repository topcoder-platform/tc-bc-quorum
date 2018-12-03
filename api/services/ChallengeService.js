/**
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This is the file for challenge service.
 *
 * @author TCSDEVELOPER
 * @version 1.0
 */
const fs = require('fs');
const Joi = require('joi');
const uuidv4 = require('uuid/v4');

const logger = require('../utils/logger');
const helper = require('../utils/helper');
const errors = require('../utils/errors');
const Consts = require('../utils/consts');
const userService = require('./UserService');
const quorumService = require('./QuorumService');
const projectService = require('./ProjectService');
const _ = require('lodash');
const Challenge = require('../models').Challenge;
const ChallengePhase = require('../models').ChallengePhase;
const ChallengeMember = require('../models').ChallengeMember;
const ChallengeReviewer = require('../models').ChallengeReviewer;
const ChallengeSubmission = require('../models').ChallengeSubmission;
const ChallengeScorecard = require('../models').ChallengeScorecard;
const ChallengeScorecardQuestion = require('../models').ChallengeScorecardQuestion;

const ChallengeReview = require('../models').ChallengeReview;
const ChallengeReviewItem = require('../models').ChallengeReviewItem;

const ChallengeAppeal = require('../models').ChallengeAppeal;
const ChallengeAppealResponse = require('../models').ChallengeAppealResponse;
const ChallengeId = require('../models').ChallengeId;

const updatingPhases = {};
/**
 * Validates all the phases.
 * @param phases the phases.
 * @private
 */
const __validatePhases = (phases) => {
  const allPhasesNames = ['Register', 'Submission', 'Review', 'Appeal', 'AppealResponse'];
  if (phases.length !== allPhasesNames.length) {
    throw new errors.ValidationError('The phases should exactly contains the phases: ' + allPhasesNames.join(','));
  }
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    if (phase.name !== allPhasesNames[i]) {
      throw new errors.ValidationError('The phases should in this order: ' + allPhasesNames.join(','));
    }
    let previousPhase = null;
    if (i > 0) {
      previousPhase = phases[i - 1];
    }
    if (previousPhase && new Date(previousPhase.endDate).getTime() !== new Date(phase.startDate).getTime()) {
      throw new errors.ValidationError('The end date in phase: ' + phase.name
        + ' should be the same as the end date of the previous phase: ' + previousPhase.name);
    }

    if (new Date(phase.endDate).getTime() < new Date(phase.startDate).getTime()) {
      throw new errors.ValidationError('The start date should less than the end date in phase: ' + phase.name);
    }
  }

};

/**
 * Creates the challenge.
 * @param operator the current operator.
 * @param payload the challenge payload.
 * @returns {Promise<*>} the result.
 */
async function create(operator, payload) {
  const client = await quorumService.getQuorumClient(operator);
  // check if the project exists
  await projectService.get(operator, payload.projectId);
  payload.createdBy = operator.memberId;
  payload.currentPhase = 'Pending';
  __validatePhases(payload.phases);
  // add the phases
  for (let i = 0; i < payload.phases.length; i++) {
    const phase = payload.phases[i];
    await client.invokeWithModel(Consts.ContractType.PublicChallenge, 'addChallengePhase', phase, ChallengePhase, {
      extraArgs: [payload.challengeId, i]
    });
  }

  await client.invokeWithModel(Consts.ContractType.PublicChallenge, 'createChallenge', payload, Challenge);

  return payload;
}

/**
 * The validate schema for create.
 */
create.schema = {
  operator: Joi.operator().required(),
  payload: Joi.object().keys({
    challengeId: Joi.id(),
    projectId: Joi.id(),
    name: Joi.string().required(),
    description: Joi.string(),
    phases: Joi.array().items({
      name: Joi.string().required(),
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().required()
    }).required(),
    prizes: Joi.object().keys({
      winners: Joi.array().items(Joi.number()).required(),
      reviewer: Joi.number().required(),
      copilot: Joi.number().required()
    }).required()
  })
};


/**
 * Updates a challenge.
 * @param operator the current operator.
 * @param challengeId the challenge id.
 * @param payload the payload.
 * @returns {Promise<*>} the result.
 */
async function update(operator, challengeId, payload) {
  if (payload.phases) {
    __validatePhases(payload.phases);
  }
  let client = null;
  if (operator) {
    payload.updatedBy = operator.memberId;
    client = await quorumService.getQuorumClient(operator);
  } else {
    client = await quorumService.getSystemQuorumClient();
  }

  // get the current challenge
  const challenge = await client.queryWithModel(
    Consts.ContractType.PublicChallenge, 'getChallengeById', [challengeId], Challenge);
  if (!challenge) {
    throw new errors.NotFoundError('cannot find challenge with id: ' + challengeId);
  }
  const updatedChallenge = _.extend({}, challenge, _.pick(payload, ['name', 'description', 'currentPhase', 'prizes', 'updatedBy']));

  await client.invokeWithModel(Consts.ContractType.PublicChallenge, 'updateChallenge', updatedChallenge, Challenge);
  // add the phases
  if (payload.phases) {
    updatingPhases[challengeId] = true;
    try {
      for (let i = 0; i < payload.phases.length; i++) {
        const phase = payload.phases[i];
        await client.invokeWithModel(Consts.ContractType.PublicChallenge, 'addChallengePhase', phase, ChallengePhase, {
          extraArgs: [payload.challengeId, i]
        });
      }
    } finally {
      updatingPhases[challengeId] = false;
    }
  }
  return updatedChallenge;
}


/**
 * The schema for update.
 */
update.schema = {
  operator: Joi.operator().required(),
  challengeId: Joi.id(),
  payload: Joi.object().keys({
    challengeId: Joi.id(),
    name: Joi.string(),
    description: Joi.string(),
    phases: Joi.array().items({
      name: Joi.string().required(),
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().required()
    }),
    prizes: Joi.object().keys({
      winners: Joi.array().items(Joi.number()).required(),
      reviewer: Joi.number().required(),
      copilot: Joi.number().required()
    })
  })
};


/**
 * Lists the challenges.
 * @returns {Promise<*>} the challenges.
 */
async function list() {
  const client = await quorumService.getSystemQuorumClient();
  let contract = Consts.ContractType.PublicChallenge;
  return await client.queryListWithModel(contract, 'getChallenge', [], Challenge);
}

/**
 * Gets the scorecard.
 * @param client the client.
 * @param challengeId the challenge id.
 * @returns {Promise<*>} the result
 */
async function getScorecard(client, challengeId) {
  const scorecard = await client.queryWithModel(Consts.ContractType.PublicChallengeReview, 'getScorecard', [challengeId], ChallengeScorecard);
  if (!scorecard) {
    return null;
  }
  // get the questions
  scorecard.questions = await client.queryListWithModel(Consts.ContractType.PublicChallengeReview, 'getScorecardQuestion', [challengeId], ChallengeScorecardQuestion);
  return scorecard;
}

/**
 * Gets a challenge detail.
 * @param challengeId the id of the challenge.
 * @returns {Promise<*>} the result.
 */
async function get(challengeId) {
  const client = await quorumService.getSystemQuorumClient();
  const result = await client.queryWithModel(
    Consts.ContractType.PublicChallenge, 'getChallengeById', [challengeId], Challenge);
  if (!result) {
    throw new errors.NotFoundError('cannot find challenge with id: ' + challengeId);
  }
  result.phases = await client.queryListWithModel(Consts.ContractType.PublicChallenge, 'getPhase', [challengeId], ChallengePhase);
  // get the challenge details
  // 1. get the members
  result.members = await client.queryListWithModel(Consts.ContractType.PublicChallengeMember, 'getMember', [challengeId], ChallengeMember);

  // 2. get the reviewers
  result.reviewers = await client.queryListWithModel(Consts.ContractType.PublicChallengeReview, 'getReviewer', [challengeId], ChallengeReviewer);

  // 3. get the submissions
  result.submissions = await client.queryListWithModel(Consts.ContractType.PublicChallengeSubmission, 'getSubmission', [challengeId], ChallengeSubmission);
  // get reviews for each submission
  const reviews = await client.queryListWithModel(Consts.ContractType.PublicChallengeReview, 'getReview', [challengeId], ChallengeReview);
  for (let i = 0; i < reviews.length; i++) {
    const review = reviews[i];
    review.reviews = await client.queryListWithModel(Consts.ContractType.PublicChallengeReview, 'getReviewItem',
      [challengeId, review.reviewerId, review.memberId], ChallengeReviewItem);
    // put the review into the submission
    for (let j = 0; j < result.submissions.length; j++) {
      const submission = result.submissions[j];
      if (submission.memberId === review.memberId) {
        submission.reviews = submission.reviews || [];
        submission.reviews.push(review);
      }
    }
  }
  // get appeals for each review
  const appeals = await client.queryListWithModel(Consts.ContractType.PublicChallengeAppeal, 'getAppeal', [challengeId], ChallengeAppeal);
  for (let i = 0; i < appeals.length; i++) {
    const reviewerId = appeals[i].reviewerId;
    const memberId = appeals[i].memberId;
    const question = appeals[i].appeal.question;
    // iterate all the review/review items to insert the appeal
    for (let j = 0; j < result.submissions.length; j++) {
      const submission = result.submissions[j];
      if (submission.memberId === memberId) {
        if (submission.reviews) {
          for (let k = 0; k < submission.reviews.length; k++) {
            const review = submission.reviews[k];
            if (review.reviewerId === reviewerId) {
              if (review.reviews) {
                for (let l = 0; l < review.reviews.length; l++) {
                  const questionItem = review.reviews[l];
                  if (questionItem.question === question) {
                    questionItem.appeal = appeals[i].appeal;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  // get appeals response for each review
  const appealResponses = await client.queryListWithModel(Consts.ContractType.PublicChallengeAppeal, 'getAppealResponse', [challengeId], ChallengeAppealResponse);
  for (let i = 0; i < appealResponses.length; i++) {
    const reviewerId = appealResponses[i].reviewerId;
    const memberId = appealResponses[i].memberId;
    const question = appealResponses[i].appealResponse.question;
    // iterate all the review/review items to insert the appeal
    for (let j = 0; j < result.submissions.length; j++) {
      const submission = result.submissions[j];
      if (submission.memberId === memberId) {
        if (submission.reviews) {
          for (let k = 0; k < submission.reviews.length; k++) {
            const review = submission.reviews[k];
            if (review.reviewerId === reviewerId) {
              if (review.reviews) {
                for (let l = 0; l < review.reviews.length; l++) {
                  const questionItem = review.reviews[l];
                  if (questionItem.question === question) {
                    if (questionItem.appeal) {
                      questionItem.appeal.appealResponse = appealResponses[i].appealResponse.text;
                      questionItem.appeal.finalScore = appealResponses[i].appealResponse.finalScore;
                    }

                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // 4. get the scorecard
  result.scorecard = await getScorecard(client, challengeId);

  return result;
}

get.schema = {
  challengeId: Joi.id()
};

/**
 * Gets a challenge with the sensitive data remvoed.
 * @param operator the operator.
 * @param challengeId the challenge id.
 * @returns {Promise<*>} the result.
 */
async function getChallengeWithPermittedData(operator, challengeId) {
  const challenge = await get(challengeId);

  if (!operator || operator.role === 'client') {
    // remove all the submission, review information for anonymous or client
    delete challenge.submissions;
    return challenge;
  }
  if (operator.role === 'copilot') {
    const project = await projectService.get(operator, challenge.projectId);
    if (project.copilotId !== operator.memberId) {
      delete challenge.submissions;
    }
  } else if (operator.role === 'manager') {
    // manager can access all the data
  } else if (operator.role === 'member') {
    // can only access his own submission
    challenge.submissions = _.filter(challenge.submissions, (s) => {
      return s.memberId === operator.memberId;
    });
    if (challenge.currentPhase !== 'Appeal' && challenge.currentPhase !== 'AppealResponse'
      && challenge.currentPhase !== 'Completed') {
      // cannot view the review of the submissions
      _.forEach(challenge.submissions, s => {
        delete s.reviews;
      });
    }
  } else if (operator.role === 'reviewer') {
    // check if he is a reviewer of this challenge
    let found = false;
    _.forEach(challenge.reviewers, r => {
      if (r.id === operator.memberId) {
        found = true;
      }
    });
    if (!found) {
      delete challenge.submissions;
    }
    // can only see his own reviewers
    _.forEach(challenge.submissions, s => {
      s.reviews = _.filter(s.reviews, r => {
        return r.reviewId === operator.memberId;
      });
    });
  }
  return challenge;
}

getChallengeWithPermittedData.schema = {
  operator: Joi.operator(),
  challengeId: Joi.id()
};

/**
 * Registers a challenge.
 * @param operator the current operator.
 * @param challengeId the challenge id to register.
 * @returns {Promise<void>} the result.
 */
async function registerChallenge(operator, challengeId) {
  const challenge = await get(challengeId);
  if (challenge.currentPhase !== 'Register') {
    throw new errors.ForbiddenError('You cannot register a challenge when it is not in Register phase');
  }
  const client = await quorumService.getQuorumClient(operator);
  await client.invoke(Consts.ContractType.PublicChallengeMember, 'registerChallenge', [challengeId]);
}


/**
 * The schema for register.
 */
registerChallenge.schema = {
  operator: Joi.operator().required(),
  challengeId: Joi.id()
};


/**
 * Unregister a challenge
 * @param operator the current operator.
 * @param challengeId the challenge id to unregister.
 * @returns {Promise<void>} the result.
 */
async function unregisterChallenge(operator, challengeId) {
  const challenge = await get(challengeId);
  if (challenge.currentPhase !== 'Register') {
    throw new errors.ForbiddenError('You cannot unregister a challenge when it is not in Register phase');
  }
  const client = await quorumService.getQuorumClient(operator);
  await client.invoke(Consts.ContractType.PublicChallengeMember, 'unregisterChallenge', [challengeId]);
}


unregisterChallenge.schema = registerChallenge.schema;

/**
 * Will register a reviewer to a challenge. Needs manager or copilot role
 * @param operator the current operatator.
 * @param challengeId the challenge id.
 * @param reviewerId the reviewer user id.
 * @returns {Promise<void>} the result.
 */
async function registerReviewer(operator, challengeId, reviewerId) {
  // validate the reviewer role
  const reviewer = await userService.getById(reviewerId);
  if (!reviewer) {
    throw new errors.BadRequestError('cannot find the reviewer with id: ' + reviewerId);
  }
  if (reviewer.role !== 'reviewer') {
    throw new errors.BadRequestError('the user with id: ' + reviewerId + ' is not a reviewer');
  }

  const client = await quorumService.getQuorumClient(operator);
  await client.invoke(Consts.ContractType.PublicChallengeReview, 'registerReviewer', [challengeId, reviewerId]);
}

/**
 * Represents the schema to register a reviewer.
 */
registerReviewer.schema = {
  operator: Joi.operator().required(),
  challengeId: Joi.id(),
  reviewerId: Joi.id()
};

/**
 * Will unregister a reviewer to a challenge. Needs manager or copilot role
 * @param operator the current operatator.
 * @param challengeId the challenge id.
 * @param reviewerId the reviewer user id.
 * @returns {Promise<void>} the result.
 */
async function unregisterReviewer(operator, challengeId, reviewerId) {
  const client = await quorumService.getQuorumClient(operator);
  await client.invoke(Consts.ContractType.PublicChallengeReview, 'unregisterReviewer', [challengeId, reviewerId]);
}

unregisterReviewer.schema = registerReviewer.schema;


/**
 * Uploads a submission. The submission file will be stored in the IPFS and
 * the submission info will store in the blockchain ledger.
 * @param operator the current operator.
 * @param file the uploaded file info.
 * @param payload the payload
 */
async function uploadSubmission(operator, file, payload) {

  try {
    if (payload.memberId !== operator.memberId) {
      throw new errors.ForbiddenError('You cannot upload the submission for another member');
    }

    // validate if the user can upload the submision

    const challengeId = payload.challengeId;
    const submissionId = uuidv4();
    const originalFileName = file.originalname;
    const fileName = `submission_${submissionId}_${originalFileName}`;
    const ipfsResult = await helper.ipfsAdd(file.path);
    // prepare the chaincode payload
    const chaincodePayload = {
      submissionId,
      challengeId: challengeId,
      memberId: payload.memberId,
      originalFileName,
      fileName,
      ipfsHash: ipfsResult.hash,
      timestamp: new Date()
    };

    const challenge = await get(challengeId);
    if (challenge.currentPhase !== 'Submission' && challenge.currentPhase !== 'Register') {
      throw new errors.ForbiddenError(
        'You can only submit an submission when the current phase is submission and register');
    }
    let registered = false;
    _.forEach(challenge.members, (member) => {
      if (member.id === operator.memberId && member.status === 1) {
        registered = true;
      }
    });

    if (!registered) {
      throw new errors.ForbiddenError('You haven not register the challenge yet');
    }

    // save the file metadata to blockchain
    const client = await quorumService.getQuorumClient(operator);

    await client.invokeWithModel(Consts.ContractType.PublicChallengeSubmission, 'uploadSubmission', chaincodePayload, ChallengeSubmission);

    return chaincodePayload;
  } finally {
    // remove the temp uploaded file
    fs.unlink(file.path, () => {
    });
  }
}

/**
 * This is the schema for upload the submission.
 */
uploadSubmission.schema = {
  operator: Joi.operator().required(),
  file: Joi.object().keys({
    path: Joi.string().required(),
    originalname: Joi.string().required()
  }).unknown().required(),
  payload: Joi.object().keys({
    challengeId: Joi.id(),
    memberId: Joi.id()
  })
};

/**
 * Downloads the submission.
 * @param operator the current operator.
 * @param request the download request.
 * @returns {Promise<{content: *, fileName: string}>} the download result.
 */
async function downloadSubmission(operator, request) {
  const challenge = await get(request.challengeId);
  // validate if can download
  if (operator.role === 'member') {
    let registered = false;
    _.forEach(challenge.members, (member) => {
      if (member.id === operator.memberId && member.status === 1) {
        registered = true;
      }
    });

    if (!registered) {
      throw new errors.ForbiddenError('You haven not register the challenge yet');
    }
  } else if (operator.role === 'copilot') {
    let project = null;
    try {
      project = await projectService.get(operator, challenge.projectId);
    } catch (e) {
      // ignore
    }

    if (!project || project.copilotId !== operator.memberId) {
      throw new errors.ForbiddenError('you are not the copilot assigned in this challenge');
    }
  }
  const client = await quorumService.getQuorumClient(operator);
  request.memberId = operator.memberId;

  const submission = await client.queryWithModel(Consts.ContractType.PublicChallengeSubmission,
    'getSubmissionById', [request.challengeId, request.submissionId], ChallengeSubmission);
  if (!submission) {
    throw new errors.NotFoundError('cannot find submission with id: ' + request.submissionId);
  }
  const result = await helper.ipfsGet(submission.ipfsHash);
  return {
    content: result.content,
    fileName: submission.fileName
  };
}



/**
 * This is the schema of the request for download the submission.
 */
downloadSubmission.schema = {
  operator: Joi.operator().required(),
  request: Joi.object().keys({
    submissionId: Joi.id(),
    challengeId: Joi.id()
  })
};


/**
 * Creates a scorecard.
 * @param operator the operator.
 * @param challengeId id of the challenge.
 * @param scorecard the scorecard to create.
 * @returns {Promise<void>} the result.
 */
async function createScorecard(operator, challengeId, scorecard) {
  const client = await quorumService.getQuorumClient(operator);
  await client.invokeWithModel(Consts.ContractType.PublicChallengeReview, 'createScorecard', scorecard, ChallengeScorecard, {
    extraArgs: [challengeId]
  });
  if (scorecard.questions) {
    for (let i = 0; i < scorecard.questions.length; i++) {
      const question = scorecard.questions[i];
      await client.invokeWithModel(Consts.ContractType.PublicChallengeReview, 'addScorecardQuestion', question, ChallengeScorecardQuestion, {
        extraArgs: [challengeId]
      });
    }
  }
  return scorecard;
}

/**
 * Reprsents the schema for createScorecard.
 */
createScorecard.schema = {
  operator: Joi.operator().required(),
  challengeId: Joi.id(),
  scorecard: Joi.object().keys({
    name: Joi.string().required(),
    questions: Joi.array().items({
      text: Joi.string().required(),
      weight: Joi.number().min(0).max(1).required(),
      order: Joi.number().integer().required()
    })
  }).required()
};


/**
 * Creates the challenge review.
 * @param operator the operator.
 * @param challengeId the id of the challenge.
 * @param review the review.
 * @returns {Promise<*>} the promise of the result.
 */
async function createChallengeReview(operator, challengeId, review) {
  if (operator.memberId !== review.reviewerId) {
    throw new errors.ForbiddenError('The reviewerId is not the same as the logged in reviewer');
  }

  const challenge = await get(challengeId);
  if (challenge == null) {
    throw new errors.BadRequestError('cannot get the challenge with id:' + challengeId);
  }
  if (challenge.currentPhase !== 'Review') {
    throw new errors.ForbiddenError('You cannot submit a review because the current challenge is not in review phase');
  }
  if (!challenge.scorecard) {
    throw new errors.ForbiddenError('There is no scorecard in this challenge, so you cannot submit a review');
  }
  const scorecardQuestions = {};
  _.forEach(challenge.scorecard.questions, q => {
    scorecardQuestions[q.order] = 'unanswered';
  });
  for (let question of review.review) {
    if (!scorecardQuestions[question.question]) {
      throw new errors.BadRequestError(`cannot find question: ${question.question} in scorecard.`)
    }
    scorecardQuestions[question.question] = 'answered';
  }
  for (let question in scorecardQuestions) {
    if (scorecardQuestions[question] !== 'answered') {
      throw new errors.BadRequestError(`the question with order: ${question} does not exist in the review.`);
    }
  }

  // check if this is a reviewer of the challenge
  let found = false;
  _.forEach(challenge.reviewers, (r) => {
    if (r.id === operator.memberId) {
      found = true;
    }
  });

  if (!found) {
    throw new errors.ForbiddenError('You are not the reviewer of this challenge');
  }

  const client = await quorumService.getQuorumClient(operator);
  await client.invokeWithModel(Consts.ContractType.PublicChallengeReview, 'createReview', review, ChallengeReview, {
    extraArgs: [challengeId]
  });
  if (review.review) {
    for (let i = 0; i < review.review.length; i++) {
      const reviewItem = review.review[i];
      await client.invokeWithModel(Consts.ContractType.PublicChallengeReview, 'addReviewItem', reviewItem, ChallengeReviewItem, {
        extraArgs: [challengeId, review.reviewerId, review.memberId]
      });
    }
  }
  return review;
}

/**
 * Reprsents the schema of create challenge review.
 */
createChallengeReview.schema = {
  operator: Joi.operator().required(),
  challengeId: Joi.id(),
  review: Joi.object().keys({
    reviewerId: Joi.id(),
    memberId: Joi.id(),
    review: Joi.array().items({
      score: Joi.number().integer().required(),
      question: Joi.number().integer().required(),
      comments: Joi.string()
    }).required()
  }).required()
};


/**
 * Creates an appeal.
 * @param operator the current operator.
 * @param challengeId the id of the challenge.
 * @param appeal the appeal.
 * @returns {Promise<*>} the result.
 */
async function createAppeal(operator, challengeId, appeal) {
  const challenge = await get(challengeId);
  if (!challenge) {
    throw new errors.BadRequestError('cannot find the challenge with id:' + challengeId);
  }

  if (challenge.currentPhase !== 'Appeal') {
    throw new errors.ForbiddenError('You cannot submit an appeal when the challenge is not in appeal phase');
  }

  let found = false;
  _.forEach(challenge.members, m => {
    if (m.id === operator.memberId && m.status === 1) {
      found = true;
    }
  });

  if (!found) {
    throw new errors.ForbiddenError('You are not a member that registered in this challenge');
  }
  let submission = null;
  _.forEach(challenge.submissions, s => {
    if (s.memberId === operator.memberId) {
      submission = s;
    }
  });
  if (!submission) {
    throw new errors.ForbiddenError('you did not submit a submission in this challenge');
  }
  found = false;
  _.forEach(submission.reviews, r => {
    if (r.reviewerId === appeal.reviewerId) {
      _.forEach(r.reviews, q => {
        if (q.question === appeal.appeal.question) {
          found = true;
        }
      })
    }
  });

  if (!found) {
    throw new errors.ForbiddenError('cannot find that review, so you cannot appeal on that');
  }

  const client = await quorumService.getQuorumClient(operator);
  await client.invokeWithModel(Consts.ContractType.PublicChallengeAppeal, 'createAppeal', appeal, ChallengeAppeal, {
    extraArgs: [challengeId]
  });
}

/**
 * Represents the schema of the create appeal.
 */
createAppeal.schema = {
  operator: Joi.operator().required(),
  challengeId: Joi.id(),
  appeal: Joi.object().keys({
    reviewerId: Joi.id(),
    memberId: Joi.id(),
    appeal: Joi.object().keys({
      text: Joi.string().required(),
      question: Joi.number().integer().required()
    })
  }).required()
};

/**
 * Creates an appeal response.
 * @param operator the current operator.
 * @param challengeId the id of the challenge.
 * @param appealResponse the appeal response.
 * @returns {Promise<*>} the result.
 */
async function createAppealResponse(operator, challengeId, appealResponse) {
  const challenge = await get(challengeId);
  if (!challenge) {
    throw new errors.BadRequestError('cannot find the challenge with id:' + challengeId);
  }

  if (challenge.currentPhase !== 'AppealResponse') {
    throw new errors.ForbiddenError('You cannot submit an appeal when the challenge is not in appeal response phase');
  }

  let found = false;
  _.forEach(challenge.reviewers, r => {
    if (r.id === operator.memberId) {
      found = true;
    }
  });

  if (!found) {
    throw new errors.ForbiddenError('You are not a reviewer for this challenge.');
  }

  let submission = null;
  _.forEach(challenge.submissions, s => {
    if (s.memberId === appealResponse.memberId) {
      submission = s;
    }
  });
  if (!submission) {
    throw new errors.ForbiddenError('there is no such a submission in that challenge');
  }
  found = false;
  _.forEach(submission.reviews, r => {
    if (r.reviewerId === appealResponse.reviewerId) {
      _.forEach(r.reviews, q => {
        if (q.appeal && q.question === appealResponse.appealResponse.question ) {
          found = true;
        }
      })
    }
  });

  if (!found) {
    throw new errors.ForbiddenError('cannot find that appeal, so you cannot response on that.');
  }

  const client = await quorumService.getQuorumClient(operator);
  await client.invokeWithModel(Consts.ContractType.PublicChallengeAppeal, 'createAppealResponse', appealResponse, ChallengeAppealResponse, {
    extraArgs: [challengeId]
  });
}

/**
 * Represents the schema of the create appeal.
 */
createAppealResponse.schema = {
  operator: Joi.operator().required(),
  challengeId: Joi.id(),
  appealResponse: Joi.object().keys({
    reviewerId: Joi.id(),
    memberId: Joi.id(),
    appealResponse: Joi.object().keys({
      text: Joi.string().required(),
      question: Joi.number().integer().required(),
      finalScore: Joi.number().required()
    })
  }).required()
};


/**
 * Updates the challenge phase.
 * @param app the application.
 * @param challenge the challenge to update.
 * @param phaseName the name of the phase.
 * @returns {Promise<string>} the result.
 */
async function updateChallengePhase(app, challenge, phaseName) {
  const phases = JSON.parse(JSON.stringify(challenge.phases));
  phases.push({
    name: 'Completed'
  });
  // update the times of the phases
  let index = -1;
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    if (phase.name === phaseName) {
      index = i;
      break;
    }
  }
  if (index < 0) {
    throw new errors.BadRequestError('cannot find the phase with name: ' + phaseName);
  }
  const previousPhaseIndex = index - 1;
  const now = new Date();
  let previousPhase = null;
  if (previousPhaseIndex >= 0) {
    // update the end time of the previous phase
    previousPhase = phases[previousPhaseIndex];
    previousPhase.endDate = now;
  }
  // for the current and following phases, shift the time ranges
  for (let i = index; i < phases.length; i++) {
    const phase = phases[i];
    let duration = 0;
    if (phase.endDate && phase.startDate) {
      duration = new Date(phase.endDate).getTime() - new Date(phase.startDate).getTime();
    }
    if (previousPhase) {
      phase.startDate = previousPhase.endDate;
    } else {
      phase.startDate = now;
    }

    if (phase.endDate) {
      phase.endDate = new Date(phase.startDate.getTime() + duration);
    }

    previousPhase = phase;
  }

  // remove the dummy completed phase
  phases.pop();

  const mutation = {
    challengeId: challenge.challengeId,
    currentPhase: phaseName,
    phases: phases
  };

  // call the update
  return await update(null, challenge.challengeId, mutation);
}

/**
 * Gets all the on going challenges.
 * @returns {Promise<*>} all the on going challenges
 */
const getOnGoingChallenges = async () => {
  const client = await quorumService.getSystemQuorumClient();
  let contract = Consts.ContractType.PublicChallenge;
  const ids =  await client.queryListWithModel(contract, 'getOnGoingChallenge', [], ChallengeId);

  const challenges = [];
  for (let i = 0; i < ids.length; i++) {
    challenges.push(await get(ids[i].id));
  }
  return challenges;
};

const isUpdatingPhases = async (challengeId) => {
  return updatingPhases[challengeId];
};

module.exports = {
  create,
  update,
  list,
  get,
  getChallengeWithPermittedData,

  registerChallenge,
  unregisterChallenge,

  registerReviewer,
  unregisterReviewer,

  uploadSubmission,
  downloadSubmission,

  createScorecard,
  createChallengeReview,
  createAppeal,
  createAppealResponse,

  updateChallengePhase,
  getOnGoingChallenges,
  isUpdatingPhases
};

logger.buildService(module.exports);