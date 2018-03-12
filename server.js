const express = require('express');
//const hbs = require('hbs');
//const fs = require('fs');

var app = express(); // to intiate the express function.

//hbs.registerPartials(__dirname + '/views/partials')
// use the tempalating engine.
//app.set('view engine', 'hbs');

/*
  * The middlewares are rendered in the order they get defined.
  * setting up the express.static as the last middleware, you can use your maintainance code in all of thee pages.
*/



// use express middleware.
app.use(express.static(__dirname + '/public'));

// get the response from the server.
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/views/about.html')
});

app.get('/work', (req, res) => {
  res.sendFile(__dirname + '/views/work.html')
});

app.get('/contact', (req, res) => {
  res.sendFile(__dirname + '/views/contact.html')
});

// create a server to make requests and get back data. Listen to some port.
app.listen(3000, () => {
  console.log('Server is up and running on port 3000')
});
