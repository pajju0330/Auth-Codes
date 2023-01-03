const mongoose = require('mongoose');

const connectjs = (url) => {
    mongoose.connect(url);
}

module.exports = connectjs;