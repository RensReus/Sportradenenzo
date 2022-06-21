const fs = require('fs-extra');

fs.copy('./src/server', './build/server', err => {
  if(err) return console.error(err);
});

fs.copy('./src/server.js', './build/server.js', err => {
  if(err) return console.error(err);
});

fs.move('./src/client/build', './build/client/build', err => {
  if(err) return console.error(err);
});
