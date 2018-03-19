require('./config/config');

const express = require('express');
const bodyParser = require('body-parser')
const hbs = require('hbs');
const _ = require('lodash');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy
const cookieParser = require('cookie-parser');
const session = require('express-session');
const marked = require('marked')
const ObjectID = require("mongoose").mongo.ObjectID
const fs = require('fs');

const {mongoose} = require('./db/mongoose');
let {Blog} = require('./models/blog')
let {Users} = require('./models/users')
let {authenticate} = require('./middleware/authenticate')

const port = process.env.PORT;

var app = express(); // to intiate the express function.

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: true,
  sanitize: true,
  smartLists: true,
  smartypants: false,
  xhtml: false
});
var sidebar = fs.readFileSync(__dirname + '/../views/partials/sidebar.hbs', 'utf8');
hbs.registerPartial('sidebar', sidebar)


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
  var markedHTML = marked(text)
  return new hbs.handlebars.SafeString(markedHTML);
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
app.use('/scripts', express.static(__dirname + '/../node_modules/marked/lib'));

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
  Blog.find({published: true}).sort('-postedAt').limit(5).then((result) => {
    console.log(result[0])
    let blogs = []
    for (let i in result) {
      blogs.push({title: result[i].title, body: result[i].body, postedAt: result[i].postedAt, id: result[i]._id});
    }
    res.render('blog.hbs', {blogs: blogs})
  }).catch((e) => {
    console.log(e)
    res.send({e})
  })

});

app.get('/blog/:id', (req,res) => {
  Blog.findOne({_id: req.params.id, published: true}).then((result) => {
    let user,url;
    if (req.isAuthenticated() === true){
      user = 'Edit'
      url = `dashboard/${result._id}`
    } else {
      user = 'Improve This Post...!'
      url = 'contact'
    }
    res.render('blog_personal.hbs', {title: result.title, body: result.body, postedAt: result.postedAt, id: result._id, user, url })
  })
})


app.get('/blogs/all',(req, res) => {
  Blog.find({published: true}).sort('-postedAt').then((result) => {
    console.log(result[0])
    let blogs = []
    for (let i in result) {
      blogs.push({title: result[i].title, body: result[i].body, postedAt: result[i].postedAt, id: result[i]._id});
    }
    res.render('blogs.hbs', {blogs: blogs})
  }).catch((e) => {
    console.log(e)
    res.send({e})
  })

});

app.get('/drafts', authenticate() ,(req, res) => {
  Blog.find({published: false}).sort('-postedAt').then((result) => {
    console.log(result[0])
    let blogs = []
    for (let i in result) {
      blogs.push({title: result[i].title, body: result[i].body, postedAt: result[i].postedAt, id: result[i]._id});
    }
    res.render('drafts.hbs', {blogs: blogs})
  }).catch((e) => {
    console.log(e)
    res.send({e})
  })

});

app.get('/drafts/:id', authenticate(), (req, res) => {
  Blog.findOne({_id: req.params.id, published: false}).then((result) => {
    console.log('Found-->', result)
    let user;
    if (req.isAuthenticated()){
      user = true
    } else {
      user = false
    }
    res.render('draft-personal.hbs', {title: result.title, body: result.body, postedAt: result.postedAt, id: result._id, user })
  })
})

app.get('/drafts/publish/:id', authenticate(), (req, res) => {
  Blog.findByIdAndUpdate(req.params.id, {$set:
                                              {published: true,
                                              postedAt: new Date()}
                                        }).then((result) => {
        res.redirect('/blog')
      }).catch((e) => {
        console.log(e)
        res.redirect('/')
      })
})

app.get('/contact',(req, res) => {
  res.render('contact.hbs')
});


app.get('/admin', (req, res) => {
  res.render('admin.hbs')
})

app.post('/admin', (req,res) => {
  passport.authenticate('local', {failureFlash: true})(req, res, () => {
    res.redirect('/dashboard')
  })
})

app.get('/dashboard', authenticate() ,(req,res) => {
  let user;
  if (req.isAuthenticated()){
    user = true
  } else {
    user = false
  }
  res.render('dashboard.hbs', {user})
 })

app.post('/dashboard', authenticate(), (req,res) => {
  let blog = new Blog({
    title: req.body.title,
    body: req.body.body,
    postedAt: new Date(),
    _author: req.user._id,
    published: true
  })

  blog.save().then((result) => {
    res.redirect('/dashboard')
  }).catch((e) =>{
    console.log(e)
     res.redirect('/') })
})

app.get('/dashboard/drafts', authenticate() ,(req,res) => {
  let user;
  if (req.isAuthenticated()){
    user = true
  } else {
    user = false
  }
  res.render('dashboard-drafts.hbs', {user})
 })

app.post('/dashboard/drafts', authenticate(), (req,res) => {
  let blog = new Blog({
    title: req.body.title,
    body: req.body.body,
    postedAt: new Date(),
    _author: req.user._id,
    published: false
  })

  blog.save().then((result) => {
    res.redirect('/dashboard/drafts')
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


app.get('/dashboard/drafts/:id', authenticate() ,(req,res) => {
  Blog.findById(req.params.id).then((result) => {
    res.render('dashboard-drafts-edit.hbs', {title: result.title, body: result.body})
  }).catch((e) => {
    console.log(e);
    res.redirect('/')
  })
 })

app.post('/dashboard/drafts/:id', authenticate(), (req,res) => {
  Blog.findByIdAndUpdate(req.params.id, {$set:
                                              {title: req.body.title,
                                               body: req.body.body,
                                               postedAt: new Date()}
                                        }).then((result) => {
    result.save().then((result) => {
      res.redirect('/drafts')
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
