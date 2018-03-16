//const {Users} = require('./../models/users');

let authenticate = () => {
  return  (req, res, next) => {
    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/admin')
  }
}

module.exports = {
  authenticate
}
