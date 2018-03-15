let mongoose = require('mongoose');

let Blog = mongoose.model('Blog', {
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5
  },
  body: {
    type: String,
    required: true,
    trim: true,
    minlength: 100
  },
  postedAt: {
    type: Number,
    default: null
  },
  _author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

module.exports = {
  Blog
}
