require('./config/config');

const express = require('express');
const bodyParser = require('body-parser')
const hbs = require('hbs');
const _ = require('lodash');
const cookieParser = require('cookie-parser');
const session = require('express-session');
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

app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');
    }
    next();
});


// middleware function to check for logged-in users
let sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/dashboard');
    } else {
        next();
    }
};

// use express middleware.
app.use(express.static(__dirname + '/public'));



// get the response from the server.
app.get('/', sessionChecker, (req, res) => {
  res.render('index.hbs')
})

app.get('/about', sessionChecker, (req, res) => {
  res.render('about.hbs')
});

app.get('/work', sessionChecker, (req, res) => {
  res.render('work.hbs')
});

app.get('/blog', sessionChecker, (req, res) => {
  res.render('blog.hbs')
});

app.get('/contact', sessionChecker, (req, res) => {
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

app.get('/admin', sessionChecker,(req, res) => {
  //console.log(req.body)
  res.render('admin.hbs')
})

app.post('/admin', (req, res) => {
        let email = req.body.email,
            password = req.body.password;
            console.log(email,password)
        Users.findByCredentials(email, password).then((user) => {
            if (!user) {
                res.redirect('/admin');
            } else {
                req.session.user = user.dataValues;
                res.redirect('/dashboard');
            }
        }).catch((e) => {res.send(e)});
    });

app.get('/dashboard', (req,res) => {
  if (req.session.user && req.cookies.user_sid) {
      res.render('dashboard.hbs');
  } else {
      res.redirect('/admin');
  }
 })


app.get('/admin/logout', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
       res.clearCookie('user_sid');
       res.redirect('/dashboard');
   } else {
       res.redirect('/admin');
   }
})

// create a server to make requests and get back data. Listen to some port.
app.listen(port, () => {
  console.log('Server is up and running on port ', port)
});
