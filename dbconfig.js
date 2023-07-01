const { development } = require('./knexfile');

var config = development

module.exports = require('knex')(config)