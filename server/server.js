require('./config/config');

const express = require('express');
const bodyParser = require('body-parser')
const hbs = require('hbs');
const _ = require('lodash');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy
const cookieParser = require('cookie-parser');
const session = require('express-session');
const markdown = require('markdown').markdown;
const markdownIt = require('markdown-it')
const ObjectID = require("mongoose").mongo.ObjectID
const fs = require('fs');
//const mongoose = require('mongoose').mongo.ObjectID
// const editor = require("pagedown-editor");
//
// function getPagedownEditor() {
//     return editor.getPagedownEditor();
// }
//
// global.window.getPagedownEditor = getPagedownEditor;

const {mongoose} = require('./db/mongoose');
let {Blog} = require('./models/blog')
let {Users} = require('./models/users')
let {authenticate} = require('./middleware/authenticate')

const port = process.env.PORT;

var app = express(); // to intiate the express function.
var md = new markdownIt();
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

hbs.registerHelper('md', (text) => {
  //let string = hbs.handlebars.Utils.escapeExpression(text)
  var marked = markdown.toHTML(text)
  return new hbs.handlebars.SafeString(marked);
})


// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize())
app.use(passport.session())

//passport middleware
passport.use(new localStrategy(Users.authenticate()))
passport.serializeUser(Users.serializeUser());
passport.deserializeUser(Users.deserializeUser());

// use express middleware.
app.use(express.static(__dirname + '/public'));
app.use('/scripts', express.static(__dirname + '/../node_modules/markdown/lib'));



// get the response from the server.
app.get('/', (req, res) => {
  res.render('index.hbs')
})

app.get('/about',(req, res) => {
  res.render('about.hbs')
});

app.get('/work', (req, res) => {
  res.render('work.hbs')
});


app.get('/blog',(req, res) => {
  Blog.find({}).sort('-postedAt').limit(5).then((result) => {
    console.log(result[0])
    let blogs = []
    for (let i in result) {
      blogs.push({title: result[i].title, body: result[i].body, postedAt: result[i].postedAt, id: result[i]._id});
    }
    //console.log(blogs)
    res.render('blog.hbs', {blogs: blogs, md: md})
  }).catch((e) => {
    console.log(e)
    res.send({e})
  })

});

app.get('/blog/:id', (req,res) => {
  console.log(req.isAuthenticated())
  Blog.findOne({_id: req.params.id}).then((result) => {
    console.log('Found-->', result)
    // let blogs = {title: result.title, body: result.body, postedAt: result.postedAt, id: result._id }
    // let blog = JSON.stringify(blogs, undefined, 4)
    // console.log('blog....123123131313****',blog)
    let user,url;
    if (req.isAuthenticated() === true){
      user = 'Edit'
      url = `dashboard/${result._id}`
    } else {
      user = 'Improve This Post...!'
      url = 'contact'
    }
    res.render('blog_personal.hbs', {title: result.title, body: result.body, postedAt: result.postedAt, id: result._id, user, url , md })
    console.log(req.params)
  })
})


app.get('/blogs/all',(req, res) => {
  Blog.find({}).sort('-postedAt').then((result) => {
    console.log(result[0])
    let blogs = []
    for (let i in result) {
      blogs.push({title: result[i].title, body: result[i].body, postedAt: result[i].postedAt, id: result[i]._id});
    }
    //console.log(blogs)
    res.render('blogs.hbs', {blogs: blogs, md: md})
  }).catch((e) => {
    console.log(e)
    res.send({e})
  })

});

app.get('/contact',(req, res) => {
  res.render('contact.hbs')
});


app.get('/admin', (req, res) => {
  //console.log(req.body)
  res.render('admin.hbs')
})

app.post('/admin', (req,res) => {
  passport.authenticate('local', {failureFlash: true})(req, res, () => {
    res.redirect('/dashboard')
  })
})

app.get('/dashboard', authenticate() ,(req,res) => {
  res.render('dashboard.hbs', {user: req.user})
  console.log(req.user)
 })

app.post('/dashboard', authenticate(), (req,res) => {
  let months = ['January', 'February', 'March', 'April',
                'May', 'June', 'July', 'August',
                'September', 'October', 'November', 'December']
  let days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  let blog = new Blog({
    title: req.body.title,
    body: req.body.body,
    postedAt: new Date(),
    _author: req.user._id
  })

  blog.save().then((result) => {
    res.redirect('/dashboard')
  }).catch((e) =>{
    console.log(e)
     res.redirect('/') })
})

app.get('/dashboard/:id', authenticate() ,(req,res) => {
  Blog.findById(req.params.id).then((result) => {
    res.render('dashboard-edit.hbs', {title: result.title, body: result.body})
  }).catch((e) => {
    console.log(e);
    res.redirect('/')
  })
  //console.log('dashboard',req.body)
  //console.log('dashboard', req.params);
 })

app.post('/dashboard/:id', authenticate(), (req,res) => {
  Blog.findByIdAndUpdate(req.params.id, {$set:
                                              {title: req.body.title,
                                               body: req.body.body}
                                        }).then((result) => {
    result.save().then((result) => {
      res.redirect('/blog')
    })
  }).catch((e) =>{
    console.log(e)
     res.redirect('/') })
})


app.get('/admin/logout', (req, res) => {
  req.logout();
  res.redirect('/admin');
})

// create a server to make requests and get back data. Listen to some port.
app.listen(port, () => {
  console.log('Server is up and running on port ', port)
});
