const {Users} = require('./../models/users');

let authenticate = (req, res, next) => {
  let token = req.header('x-auth')

  Users.findByCredentials(req.body.email, req.body.password).then((result) => {
    if (!result) {
      return Promise.reject()
    }
    req.user = result;
    //req.token = token;
    next();
  }).catch((e) => res.send(e))
}

module.exports = {
  authenticate
}
