var fs = require('fs');
if (fs.existsSync('./sqlDBlink.js')) {
    var sqlDBstring = require('./sqlDBlink');
} else {
    var sqlDBstring = process.env.DATABASE_URL;
}

// Initialize SQL Database
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: sqlDBstring,
  ssl: true,
});
module.exports = pool;
//sqlDB.connect();
//module.exports = sqlDB;
// ========================
