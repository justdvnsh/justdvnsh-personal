const {Users} = require('./../models/users');

let authenticate = (req, res, next) => {
  let token = req.header('x-auth')

  Users.findByToken(token).then((result) => {
    if (!result) {
      return Promise.reject()
    }

    req.user = result;
    req.token = token;
    next();
  }).catch((e) => res.send(e))
}

module.exports = {
  authenticate
}
