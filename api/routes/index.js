/**
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This file defines the routers.
 *
 * @author TCSDEVELOPER
 * @version 1.0
 */
module.exports = {
  '/users': {
    post: {
      controller: 'UserController', method: 'create'
    },
    get: {
      controller: 'UserController', method: 'list'
    }
  },
  '/login': {
    post: {
      controller: 'UserController', method: 'login'
    },
  },

  '/projects': {
    post: {
      controller: 'ProjectController', method: 'create', auth: ['manager', 'client']
    },
    get: {
      controller: 'ProjectController', method: 'list', auth: ['manager', 'client', 'copilot']
    }
  },
  '/projects/:projectId': {
    get: {
      controller: 'ProjectController', method: 'get', auth: ['manager', 'client', 'copilot']
    },
    put: {
      controller: 'ProjectController', method: 'update', auth: ['manager']
    }
  },

  '/challenges': {
    post: {
      controller: 'ChallengeController', method: 'create', auth: ['copilot', 'manager']
    },
    get: {
      controller: 'ChallengeController', method: 'list'
    }
  },
  '/challenges/:challengeId': {
    get: {
      controller: 'ChallengeController', method: 'get', auth: ['manager', 'client', 'copilot', 'member', 'reviewer', 'anonymous']
    },
    put: {
      controller: 'ChallengeController', method: 'update', auth: ['copilot', 'manager']
    }
  },
  '/challenges/:challengeId/register': {
    post: {
      controller: 'ChallengeController', method: 'registerChallenge', auth: ['member']
    },
    delete: {
      controller: 'ChallengeController', method: 'unregisterChallenge', auth: ['member']
    },
  },
  '/challenges/:challengeId/reviewer/:userId': {
    post: {
      controller: 'ChallengeController', method: 'registerReviewer', auth: ['copilot', 'manager']
    },
    delete: {
      controller: 'ChallengeController', method: 'unregisterReviewer', auth: ['copilot', 'manager']
    },
  },
  '/challenges/:challengeId/submissions': {
    post: {
      controller: 'ChallengeController', method: 'uploadSubmission', auth: ['member']
    }
  },
  '/challenges/:challengeId/submissions/:submissionId': {
    get: {
      controller: 'ChallengeController', method: 'downloadSubmission', auth: ['member', 'manager', 'copilot']
    }
  },


  '/challenges/:challengeId/scorecard': {
    post: {
      controller: 'ChallengeController', method: 'createScorecard', auth: ['manager', 'copilot']
    }
  },
  '/challenges/:challengeId/review': {
    post: {
      controller: 'ChallengeController', method: 'createChallengeReview', auth: ['reviewer']
    }
  },
  '/challenges/:challengeId/appeals': {
    post: {
      controller: 'ChallengeController', method: 'createAppeal', auth: ['member']
    }
  },
  '/challenges/:challengeId/appealResponse': {
    post: {
      controller: 'ChallengeController', method: 'createAppealResponse', auth: ['reviewer']
    }
  }
};