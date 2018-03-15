const mongoose = require('mongoose');
const validator = require('validator')
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')

let UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
});

// to specify the data we want to return.
UserSchema.methods.toJSON = function() {
  let userObject = this.toObject();
  return _.pick(userObject, ['email', 'password'])
}

// to set the custom methods for the instance of the object model.
UserSchema.methods.generateAuthToken = function() {
  let user = this; // because this is a custom method for the instance of the object model.
  let access = 'auth';
  let token = jwt.sign({
    _id: user._id.toHexString(),
    access
  }, '123abc').toString();

  user.tokens.push({access, token})
  // return save method , to chain other promise callbacks.
  return user.save().then(() => {
    return token;
  })
}

UserSchema.methods.removeToken = function (token) {
  let user = this;
  return user.update({
    $pull: {
      token: {token}
    }
  });
}

UserSchema.statics.findByToken = function(token) {
  let Users = this;
  let decoded;

  try{
    decoded = jwt.verify(token, '123abc')
  }catch (e) {
    return Promise.reject()
  }

  return Users.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  })
}

UserSchema.statics.findByCredentials = function (email, password) {
  let User = this;

  return User.findOne({email}).then((user) => {
    if (!user) {
      return Promise.reject();
    }

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user);
        } else {
          reject();
        }
      })
    })
  })
}

UserSchema.pre('save', function(next) {
  let user = this;
  if (user.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash
        next();
      })
    })
  } else {
    next();
  }
})

let Users = mongoose.model('Users', UserSchema)

module.exports = {
  Users
}
