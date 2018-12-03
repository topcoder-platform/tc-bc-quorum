/**
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This is the file for user service.
 *
 * @author TCSDEVELOPER
 * @version 1.0
 */
const config = require('config');
const crypto = require('crypto')
const Joi = require('joi');

const Consts = require('../utils/consts');
const errors = require('../utils/errors');
const helper = require('../utils/helper');
const logger = require('../utils/logger');
const quorumService = require('./QuorumService');
const User = require('../models').User;

/**
 * Creates a user.
 * @param payload the user payload.
 * @returns {Promise<*>} the promise of the user.
 */
async function create(payload) {
  // validate the existence of the user
  let eUser = await getByEmail(payload.memberEmail);
  if (eUser) {
    throw new errors.ConflictError(`User with email ${payload.memberEmail} already exists.`);
  }
  eUser = await getById(payload.memberId);
  if (eUser) {
    throw new errors.ConflictError(`User with id ${payload.memberId} already exists.`);
  }

  // create the eth account
  payload.memberAddress = await quorumService.createEthAccount(payload.role);
  const client = await quorumService.getSystemQuorumClient();
  await client.invokeWithModel(Consts.ContractType.PublicUser, 'createUser', payload, User);
  return payload;
}

/**
 * The schema for the create method.
 */
create.schema = {
  payload: Joi.object().keys({
    memberId: Joi.id(),
    memberEmail: Joi.emailId(),
    role: Joi.roles().required()
  }).required()
};

/**
 * Gets the user by id.
 *
 * @param memberId the member id.
 *
 * @returns {Promise<*>} the user by id.
 */
async function getById(memberId) {
  const client = await quorumService.getSystemQuorumClient();
  return await client.queryWithModel(Consts.ContractType.PublicUser, 'getUserById', [memberId], User);
}

/**
 * Gets the user by email.
 *
 * @param memberEmail the member email.
 *
 * @returns {Promise<*>} the user by email.
 */
async function getByEmail(memberEmail) {
  const client = await quorumService.getSystemQuorumClient();
  return await client.queryWithModel(Consts.ContractType.PublicUser, 'getUserByEmail', [memberEmail], User);
}

/**
 * List the users.
 * @returns {Promise<*>} the result.
 */
async function list() {
  const client = await quorumService.getSystemQuorumClient();
  const count = await client.query(Consts.ContractType.PublicUser, 'getUsersCount', []);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(await client.queryWithModel(Consts.ContractType.PublicUser, 'getUser', [i], User));
  }
  return result;
}


/**
 * Do the login.
 * @param loginInfo the login request.
 * @returns {Promise<{token: *}>} the promise of th eresult with token.
 */
async function login(loginInfo) {
  // find the user from blockchain
  const user = await getById(loginInfo.memberId);
  if (!user) {
    throw new errors.BadRequestError('cannot find user with memberId: ' + loginInfo.memberId);
  }

  const token = helper.generateJWTToken({
    name: user.name,
    email: user.memberEmail,
    id: user.memberId
  });
  return {
    token
  };
}

login.schema = {
  loginInfo: Joi.object().keys({
    memberId: Joi.id()
  }).required()
};



module.exports = {
  getById,
  create,
  list,
  login
};

logger.buildService(module.exports);