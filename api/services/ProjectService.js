/**
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This is the file for project service.
 *
 * @author TCSDEVELOPER
 * @version 1.0
 */
const Joi = require('joi');
const config = require('config');
const _ = require('lodash');
const errors = require('../utils/errors');
const logger = require('../utils/logger');
const userService = require('./UserService');
const quorumService = require('./QuorumService');
const Consts = require('../utils/consts');
const Project = require('../models').Project;
/**
 * Checks if the copilot id is a real copilot or not.
 * @param copilotId the copilot id.
 * @returns {Promise<void>} the result, if not copilot, throws exception.
 */
async function validateCopilot(copilotId) {
  const user = await userService.getById(copilotId);
  if (!user) {
    throw new errors.ValidationError('cannot find user of the copilot with id: ' + copilotId);
  }
  if (!user.role || user.role !== 'copilot') {
    throw new errors.ValidationError('User with id: ' + copilotId + ' is not a copilot');
  }
}

const getPrivateFor = (operator) => {
  if (operator.role === 'manager') {
    console.log([config.quorum.client.nodeKey])
    return [config.quorum.client.nodeKey];
  } else if (operator.role === 'client') {
    console.log([config.quorum.topcoder.nodeKey])
    return [config.quorum.topcoder.nodeKey];
  } else {
    throw new errors.InternalError('private contracts are for manager and client only');
  }
};

/**
 * Creates a project.
 * @param operator the user doing the current operation.
 * @param payload the payload.
 * @returns {Promise<*>} the result.
 */
async function create(operator, payload) {
  payload.status = 'draft';

  if (payload.copilotId) {
    await validateCopilot(payload.copilotId);
  }

  // validate the clientId is a client
  const clientUser = await userService.getById(payload.clientId);
  if (!clientUser) {
    throw new errors.ValidationError('cannot find user of the client with id: ' + payload.clientId);
  }
  if (!clientUser.role || clientUser.role !== 'client') {
    throw new errors.ValidationError('User with id: ' + payload.clientId + ' is not a client');
  }

  const projectId = payload.projectId;

  payload.createdBy = operator.memberId;

  const client = await quorumService.getQuorumClient(operator);
  const eProject = await client.queryWithModel(Consts.ContractType.PrivateProject, 'getProjectById', [projectId], Project);
  if (eProject) {
    throw new errors.ConflictError(`project ${projectId} already exists.`);
  }

  await client.invokeWithModel(Consts.ContractType.PrivateProject, 'createProject', payload, Project, {privateFor: getPrivateFor(operator)});

  return payload;
}

/**
 * The schema for create.
 */
create.schema = {
  operator: Joi.operator().required(),
  payload: Joi.object().keys({
    projectId: Joi.id(),
    clientId: Joi.id(),
    copilotId: Joi.optionalId(),
    name: Joi.string().required(),
    description: Joi.string(),
    budget: Joi.number().integer().min(0).required(),
    status: Joi.string().valid('active', 'draft')
  }).required()
};

/**
 * Updates a project.
 * @param operator the current operator
 * @param projectId the id of the project.
 * @param payload the payload.
 * @returns {Promise<*>} the result.
 */
async function update(operator, projectId, payload) {

  if (payload.copilotId) {
    await validateCopilot(payload.copilotId);
  }

  payload.updatedBy = operator.memberId;
  const client = await quorumService.getQuorumClient(operator);
  const eProject = await client.queryWithModel(Consts.ContractType.PrivateProject, 'getProjectById', [projectId], Project);
  if (eProject === null) {
    throw new errors.NotFoundError('cannot find project with id: ' + projectId);
  }

  if (eProject.status !== 'draft' && payload.status === 'draft') {
    throw new errors.BadRequestError('cannot rollback the project to draft');
  }

  const updatedProject = _.extend({}, eProject, payload);

  // update to private contract
  await client.invokeWithModel(Consts.ContractType.PrivateProject, 'updateProject', updatedProject, Project, {privateFor: getPrivateFor(operator)});


  if (eProject.status === 'draft' && payload.status && payload.status !== 'draft') {
    // copy to public contract
    await client.invokeWithModel(Consts.ContractType.PublicProject, 'createProject', updatedProject, Project);
  } else if (eProject.status !== 'draft') {
    // update in public contract (sync)
    await client.invokeWithModel(Consts.ContractType.PublicProject, 'updateProject', updatedProject, Project);
  }

  return updatedProject;
}

/**
 * The schema for update.
 */
update.schema = {
  operator: Joi.operator().required(),
  projectId: Joi.id(),
  payload: Joi.object().keys({
    projectId: Joi.id(),
    copilotId: Joi.optionalId(),
    name: Joi.string(),
    description: Joi.string(),
    budget: Joi.number().integer().min(0),
    status: Joi.string().valid('draft', 'active')
  })
};


/**
 * Gets the project by id.
 * @param operator the operator
 * @param projectId the id of the project.
 * @returns {Promise<*>} the result.
 */
async function get(operator, projectId) {
  let contract = Consts.ContractType.PrivateProject;
  if (operator.role === 'copilot') {
    contract = Consts.ContractType.PublicProject;
  }
  const client = await quorumService.getQuorumClient(operator);
  const project = await client.queryWithModel(contract, 'getProjectById', [projectId], Project);
  if (!project) {
    throw new errors.BadRequestError('cannot find the project with id: ' + projectId);
  }
  if (operator.role === 'copilot' && operator.memberId !== project.copilotId) {
    throw new errors.BadRequestError('cannot find the project with id: ' + projectId);
  }
  if (operator.role === 'client' && operator.memberId !== project.clientId) {
    throw new errors.BadRequestError('cannot find the project with id: ' + projectId);
  }
  return project;
}

/**
 * The schema for get.
 */
get.schema = {
  operator: Joi.operator().required(),
  projectId: Joi.id()
};


/**
 * Lists the projects of a channel.
 * @param operator, the current operator
 * @param channelName the name of the channel.
 * @returns {Promise<*>} the result.
 */
async function list(operator) {
  const client = await quorumService.getQuorumClient(operator);
  let contract = Consts.ContractType.PrivateProject;
  if (operator.role === 'copilot') {
      contract = Consts.ContractType.PublicProject;
  }
  return (await client.queryListWithModel(contract, 'getProject', [], Project)).filter(p => {
    if (operator.role === 'copilot' && p.copilotId !== operator.memberId) {
      return false;
    }
    if (operator.role === 'client' && p.clientId !== operator.memberId) {
      return false;
    }
    return true;
  });
}

/**
 * The schema for list.
 */
list.schema = {
  operator: Joi.operator().required()
};

module.exports = {
  create,
  update,
  get,
  list
};

logger.buildService(module.exports);