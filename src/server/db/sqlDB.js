var fs = require('fs');
if (fs.existsSync('./src/server/db/sqlDBlink.js')) {
    var sqlDBstring = require('./sqlDBlink');
} else {
    var sqlDBstring = process.env.DATABASE_URL;
}

const { Pool } = require('pg')

var types = require('pg').types
types.setTypeParser(20, function(val) {
  return parseInt(val)
})

const pool = new Pool({
    connectionString: sqlDBstring,
    rejectUnauthorized: false,
    ssl: true,
    max: 3
})

module.exports = {
  query: async (query, params, adminPage) => {
    try {
      return await pool.query(query, params);
    } catch (error) {
      if (adminPage) {
        return error;
      } else {
        console.log("Query Error: ", error);
        console.log("Query: ", query)
        console.log("Params: ", params)
        throw error;
      }
    }
  }
}