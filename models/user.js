let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let bcrypt = require('bcrypt-nodejs');

let UserSchema = new Schema({
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {type: String},
  role: {
    type: String,
    enum: ['Shopper', 'Business'],
    required: true
  },
  transactions: [{
    transactionName: {type: String},
    transactionAmount: {type: String},
    transactionDate: {type: String},
  }],
  subscriptions: [{
    business: {type: String},
    visits: {type: Number},
    reward: {type: Number},
    goalVisits: {type: Number},
    minSpend: {type: Number}
  }],
  campaigns: [{
    name: {type: String},
    description: {type: String},
    numVisits: {type: Number},
    minSpent: {type: Number},
    reward: {type: Number},
    startDate: {type: String},
    endDate: {type: String}
  }],
  totalRewards: {
    type: Number,
    default: 0
  },
  authTokens: [{
    type: String
  }],
  connectTokens: [{
    type: String
  }],
  stripeCustomerID: {type: String},
  spareChange: {
    type: Number,
    default: 0
  },
  lastRefresh: {type: Date},
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
},
{
  timestamps: true
});

UserSchema.pre('save', function(next) {
  let user = this;
  let SALT_FACTOR = 5;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) { return cb(err); }
    cb(null, isMatch);
  });
}

module.exports = mongoose.model('User', UserSchema);
