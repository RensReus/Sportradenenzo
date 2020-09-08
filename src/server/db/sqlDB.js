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
    max: 5
})

module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback)
  },
  getClient: (callback) => {
    pool.connect((err, client, done) => {
      const query = client.query.bind(client)

      // monkey patch the query method to keep track of the last query executed
      client.query = () => {
        client.lastQuery = arguments
        client.query.apply(client, arguments)
      }

      // set a timeout of 5 seconds, after which we will log this client's last query
      const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!')
        console.error(`The last executed query on this client was: ${client.lastQuery}`)
      }, 5000)

      const release = (err) => {
        // call the actual 'done' method, returning this client to the pool
        done(err)

        // clear our timeout
        clearTimeout(timeout)

        // set the query method back to its old un-monkey-patched version
        client.query = query
      }

      callback(err, client, done)
    })
  }
}