let mongoose = require('mongoose');

let Blog = mongoose.model('Blog', {
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 1
  },
  body: {
    type: String,
    required: true,
    trim: true,
    minlength: 1
  },
  postedAt: {
    type: String,
    default: null
  },
  _author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  tags: [String]
});

module.exports = {
  Blog
}
