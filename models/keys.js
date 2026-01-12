const mongo = require('mongoose');

const tombs = new mongo.Schema
({
    threadID: String,
    members: [{
      type: String,
      required: true
    }],
    tomb: String,
    
});

const inventory = new mongo.Schema
({
  userID: { type: String, unique: true },
  tomes: [{
    name: String,
    quantity: { type: Number, default: 1 }
  }]
});

const profileSchema = new mongo.Schema
({
    userID: { type: String, unique: true },
    consumedTomes: [String]
});

module.exports = {
  tombs: mongo.model('tombs', tombs),
  inventory: mongo.model('inventory', inventory, 'inventory'),
  profile: mongo.model('profile', profileSchema, 'profile')
};