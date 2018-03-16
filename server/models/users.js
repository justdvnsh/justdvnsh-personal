const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose')

let UserSchema = new mongoose.Schema({
  email: String,
  username: String,
  password: String
});

UserSchema.plugin(passportLocalMongoose)

let Users = mongoose.model('Users', UserSchema)

module.exports = {
  Users
}
