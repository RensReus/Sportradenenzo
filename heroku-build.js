const fs = require('fs-extra');

fs.move('./src/client/build/', './build/client/build/', err => {
  if(err) return console.error(err);
});
