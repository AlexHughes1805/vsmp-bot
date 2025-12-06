const mongo = require('mongoose');

const tomes = new mongo.Schema
({
  userID: String,
  tome: String
});

module.exports = mongo.model('tomes', tomes)