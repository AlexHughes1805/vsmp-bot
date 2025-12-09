const mongo = require('mongoose');

const tomes = new mongo.Schema
({
  userID: String,
  tome: String
});

const tombs = new mongo.Schema
({
    userID: String,
    tomb: String
 
});

module.exports = {
  tomes: mongo.model('tomes', tomes),
  tombs: mongo.model('tombs', tombs)
};