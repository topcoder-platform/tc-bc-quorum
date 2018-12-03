/**
 * Initialize and exports all models.
 */
const fs = require('fs');
const models = {};

// Bootstrap models
fs.readdirSync(__dirname).forEach((file) => {
  if (file !== 'index.js') {
    const filename = file.split('.')[0];
    models[filename] = require(__dirname + '/' + filename);
  }
});

module.exports = models;
