require('./config/config');

const express = require('express');
const bodyParser = require('body-parser')
const hbs = require('hbs');
const _ = require('lodash');
//const fs = require('fs');

const {mongoose} = require('./db/mongoose');
let {Blog} = require('./models/blog')
let {Users} = require('./models/users')
let {authenticate} = require('./middleware/authenticate')

const port = process.env.PORT;

var app = express(); // to intiate the express function.

//hbs.registerPartials(__dirname + '/views/partials')
// use the tempalating engine.
//app.set('view engine', 'hbs');

/*
  * The middlewares are rendered in the order they get defined.
  * setting up the express.static as the last middleware, you can use your maintainance code in all of thee pages.
*/

app.set('view engine', 'hbs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// use express middleware.
app.use(express.static(__dirname + '/public'));



// get the response from the server.
app.get('/', (req, res) => {
  res.render('index.hbs')
})

app.get('/about', (req, res) => {
  res.render('about.hbs')
});

app.get('/work', (req, res) => {
  res.render('work.hbs')
});

app.get('/blog', (req, res) => {
  res.render('blog.hbs')
});

app.get('/contact', (req, res) => {
  res.render('contact.hbs')
});

app.post('/admin/signup', (req,res) => {
  let body = _.pick(req.body, ['email', 'password']);
  let user = new Users(body);

  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).send(user);
  }).catch((e) => {
    res.send(e)
  })
})

// app.get('/users/me', authenticate,(req, res) => {
//   res.status(200).send(req.user)
// })

app.get('/admin', (req, res) => {
  //console.log(req.body)
  res.render('admin.hbs')
})

app.post('/admin', (req, res) => {
  console.log(req.body)
  let body = _.pick(req.body, ['email', 'password'])
  console.log(body)

  Users.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      console.log(req.body.email, req.body.password)
      res.header('x-auth', token).send({user})
    })
  }).catch((e) => {
    console.log('error:->',{e})
    res.status(400).send(e)
  })
})

// app.get('/admin/blog', authenticate, (req,res) => {
//   res.render('admin_blog.hbs', {email: req.body})
// })


app.post('/admin/logout', (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.redirect('/')
  }).catch((e) => {
    res.send(e)
  })
})

// create a server to make requests and get back data. Listen to some port.
app.listen(port, () => {
  console.log('Server is up and running on port ', port)
});
