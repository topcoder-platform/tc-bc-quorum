/**
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This file is auto-updates the challenges phase if the timing or other conditions meet.
 * @author TCSDEVELOPER
 * @version 1.0
 */

const challengeService = require('../services/ChallengeService');
const _ = require('lodash');
let app = null;

/**
 * Gets the phase info.
 * @param challenge the challenge.
 * @param phase the phase.
 * @returns {*} the phase result.
 * @private
 */
const __getPhaseInfo = (challenge, phase) => {
  return challenge.phases.filter(p => p.name === phase).shift();
};

/**
 * Updates the challenge phase.
 * @param challenge the challenge.
 * @param phase the phase
 * @returns {Promise<string>} the challenge phase.
 * @private
 */
const __updateChallengePhase = async (challenge, phase) => {
  // updates the challenge
  return await challengeService.updateChallengePhase(app, challenge, phase);
};

/**
 * Handles the pending phase.
 * @param challenge the challenge.
 * @returns {Promise<void>} the phase.
 */
const handlePendingPhase = async (challenge) => {
    const phase = __getPhaseInfo(challenge, 'Register');
    if (new Date(phase.startDate).getTime() < new Date().getTime()) {
      // register begin
      await __updateChallengePhase(challenge, 'Register');
    }
};

/**
 * Handles the register phase.
 * @param challenge the challenge.
 * @returns {Promise<void>} the phase.
 */
const handleRegisterPhase = async (challenge) => {
  const phase = __getPhaseInfo(challenge, 'Submission');
  if (new Date(phase.startDate).getTime() < new Date().getTime()) {
    // register begin
    await __updateChallengePhase(challenge, 'Submission');
  }
};

/**
 * Handles the submission phase.
 * @param challenge the challenge.
 * @returns {Promise<void>} the phase.
 */
const handleSubmissionPhase = async (challenge) => {
  const phase = __getPhaseInfo(challenge, 'Review');
  if (new Date(phase.startDate).getTime() < new Date().getTime()) {
    // register begin
    await __updateChallengePhase(challenge, 'Review');
  }
};

/**
 * Handles the review phase.
 * @param challenge the challenge.
 * @returns {Promise<void>} the phase.
 */
const handleReviewPhase = async (challenge) => {
  // check if all the submissions has a review submitted
  // number of reviewers
  const numberOfReviewers = challenge.reviewers.length || 0;
  let ok = true;
  _.forEach(challenge.submissions, (submission) => {
    if (!submission.reviews || submission.reviews.length < numberOfReviewers) {
      ok = false;
    }
  });
  if (ok) {
    await __updateChallengePhase(challenge, 'Appeal');
  }
};

/**
 * Handles the appeal phase.
 * @param challenge the challenge.
 * @returns {Promise<void>} the phase.
 */
const handleAppealPhase = async (challenge) => {
  const phase = __getPhaseInfo(challenge, 'AppealResponse');
  if (new Date(phase.startDate).getTime() < new Date().getTime()) {
    // register begin
    await __updateChallengePhase(challenge, 'AppealResponse');
  }
};

/**
 * Handles the appeal response phase.
 * @param challenge the challenge.
 * @returns {Promise<void>} the phase.
 */
const handleAppealResponsePhase = async (challenge) => {
  let ok = true;
  // all the appeals has response
  _.forEach(challenge.submissions, (submission) => {
    _.forEach(submission.reviews, (review) => {
      _.forEach(review.reviews, q => {
        if (q.appeal) {
          if (!q.appeal.appealResponse || _.isNil(q.appeal.finalScore)) {
            ok = false;
          }
        }
      });

    })
  });
  if (ok) {
    await __updateChallengePhase(challenge, 'Completed');
  }
};


module.exports = async (expressApp) => {
  app = expressApp;
  // get all the on-going challenges
  const challenges = await challengeService.getOnGoingChallenges();
  for (let challenge of challenges) {
    if (await challengeService.isUpdatingPhases(challenge.challengeId)) {
      continue;
    }
    if (challenge.currentPhase === 'Pending') {
      await handlePendingPhase(challenge);
    } else if (challenge.currentPhase === 'Register') {
      await handleRegisterPhase(challenge);
    } else if (challenge.currentPhase === 'Submission') {
      await handleSubmissionPhase(challenge);
    } else if (challenge.currentPhase === 'Review') {
      await handleReviewPhase(challenge);
    } else if (challenge.currentPhase === 'Appeal') {
      await handleAppealPhase(challenge);
    } else if (challenge.currentPhase === 'AppealResponse') {
      await handleAppealResponsePhase(challenge);
    }
  }
};
