const mongo = require('mongoose');

const tomes = new mongo.Schema
({
  userID: String,
  tome: String
});

const tombs = new mongo.Schema
({
    threadID: String,
    members: [{
      type: String,
      required: true
    }],
    tomb: String,
    
});

const profile = new mongo.Schema
({
    userID: String,
    tome: String
});

module.exports = {
  tomes: mongo.model('tomes', tomes),
  tombs: mongo.model('tombs', tombs),
  profile: mongo.model('profile', profile)
};