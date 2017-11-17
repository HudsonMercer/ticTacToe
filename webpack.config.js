var path = require('path');

module.exports = {
  entry: './js/scripts.js',
  output: {
    path: path.resolve(__dirname, 'js'),
    filename: 'jscript.js'
  }
};
