const _ = require('lodash');
const config = require('config');
const Consts = require('./consts');

const errors = require('../utils/errors');

const flattenEntity = (entity, model, isPrivate) => {
  const columns = model.columns;
  const result = [];
  for (let column of columns) {
    if (!isPrivate && column.private === true) {
      continue;
    }
    if (_.isNil(entity[column.name])) {
      if (column.type === Number) {
        result.push(0);
      } else {
        result.push('');
      }
    } else {
      result.push(entity[column.name]);
    }
  }
  if (model.flatten) {
    model.flatten(entity, result);
  }
  return result;
};

const populateEntity = (tuple, model, isPrivate) => {
  if (!_.isObject(tuple)) {
    tuple = {
      0: tuple
    }
  }
  const columns = model.columns;
  let entity = {};
  let currentIndex = 0;
  for (let i = 0; i < columns.length; i++) {
    if (!isPrivate && columns[i].private === true) {
      continue;
    }
    const value = tuple[currentIndex++];
    const column = columns[i].name;
    if (!value) {
      entity[column] = null;
      continue;
    }
    if (columns[i].type === Number) {
      entity[column] = Number(value);
    } else {
      entity[column] = value;
    }

  }
  if (model.id && !entity[model.id]) {
    return null;
  }
  if (model.toJSON) {
    entity = model.toJSON(entity);
  }
  return entity;
};

const gasLimit = 0x47b760;

module.exports = class QuorumClient {
  constructor(contracts, address) {
    this.address = address;
    this.contracts = contracts;
  }

  async invoke(contractType, method, args, options) {
    const contract = this._getContract(contractType);
    const opt = _.extend({from: this.address, gas: gasLimit}, options);
    const extraArgs = opt.extraArgs || [];
    delete opt.extraArgs;
    return await contract.methods[method](...extraArgs, ...args).send(opt);
  }

  async invokeWithModel(contractType, method, entity, model, options) {
    const contract = this._getContract(contractType);
    const opt = _.extend({from: this.address, gas: gasLimit}, options);
    const extraArgs = opt.extraArgs || [];
    delete opt.extraArgs;
    const isPrivate = contractType === Consts.ContractType.PrivateProject;
    return await contract.methods[method](...extraArgs, ...flattenEntity(entity, model, isPrivate)).send(opt);
  }


  async query(contractType, method, args) {
    const contract = this._getContract(contractType);
    return await contract.methods[method](...args).call({from: this.address, gas: gasLimit});
  }

  async queryWithModel(contractType, method, args, model) {
    const contract = this._getContract(contractType);
    const isPrivate = contractType === Consts.ContractType.PrivateProject;
    let result = {};
    if (model.groups) {
      let index = 0;
      let currentIndex = 0;
      for (let groupName in model.groups) {
        const columnNames = model.groups[groupName].filter(c => {
          currentIndex++;
          if (!isPrivate && model.columns[currentIndex - 1].private) {
            return false;
          }
          return true;
        });
        const iResult = await contract.methods[`${method}${groupName}`](...args).call({from: this.address, gas: gasLimit});
        if (columnNames.length !== _.keys(iResult).length) {
          throw new errors.InternalError(
            'The return length from solidity is not the same defined in the model of project');
        }
        for (let i = 0; i < columnNames.length; i++) {
          result[i + index] = iResult[i];
        }
        index += columnNames.length;
      }
    } else {
      result = await contract.methods[method](...args).call({from: this.address, gas: gasLimit});
    }

    return populateEntity(result, model, isPrivate);
  }

  async queryListWithModel(contractType, methodPrefix, args, model) {
    const countMethod = `${methodPrefix}sCount`;
    const queryItemMethod = `${methodPrefix}`;
    const count = await this.query(contractType, countMethod, args);
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(await this.queryWithModel(contractType, queryItemMethod, [...args, i], model));
    }
    return result;
  }

  _getContract(contractType) {
    return this.contracts[contractType];
  }
};