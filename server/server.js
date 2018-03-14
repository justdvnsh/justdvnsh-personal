require('./config/config');

const express = require('express');
const bodyParser = require('body-parser')
const hbs = require('hbs');
//const fs = require('fs');

const {mongoose} = require('./db/mongoose');
let {Blog} = require('./models/blog')
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

// create a server to make requests and get back data. Listen to some port.
app.listen(port, () => {
  console.log('Server is up and running on port ', port)
});
