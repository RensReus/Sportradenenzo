// Initialize connection
var fs = require('fs');
if (fs.existsSync('./config/sqlDBlink.js')) {
  var sqlDBstring = require('./config/sqlDBlink.js');
} else {
  var sqlDBstring = process.env.DATABASE_URL;
}

const { Client } = require('pg');
const sqlDB = new Client({
  connectionString: sqlDBstring,
  ssl: true,
});

sqlDB.connect();


function addRiderToSelection (rider_participation_id, account_id, raceName, year, callback) {
  var race_id = `(SELECT race_id FROM race WHERE name = '${raceName}' and year = ${year})`
  var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${account_id} AND race_id = ${race_id})`;
  var query = `INSERT INTO team_selection_rider(rider_participation_id,account_participation_id)
              VALUES(${rider_participation_id},${account_participation_id})`;
  
  sqlDB.query(query, (err, res) => {
      if (err) throw err;
      else callback(err,res.rows)
  })
}


/** Removes a rider from team selection
 * @param {number} account_id
 * @param {number} rider_participation_id
 * @param {String} raceName
 * @param {int} year
 */
function removeRiderFromSelection (account_id, rider_participation_id, raceName, year, callback) {
  var race_id = `(SELECT race_id FROM race WHERE name = '${raceName}' and year = ${year})`;
  var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${account_id} AND race_id = ${race_id})`;
  var query = `DELETE FROM team_selection_rider 
              WHERE account_participation_id = ${account_participation_id}))
              AND rider_participation_id = ${rider_participation_id}`;
  
  sqlDB.query(query, (err, res) => {
    if (err) throw err;
    else callback(err,res.rows)
  })
}

/**add a new account to the database and returns it
 * @param {String} email
 * @param {String} password
 * @param {function} callback
 */
function addAccount(email, password, callback){
  var query = `INSERT INTO account(email, password)
              VALUES('${email}', '${password}')
              RETURNING *`;
              
  sqlDB.query(query, (err, res) => {
    if (err) throw err;
    else callback(err,res.rows[0])
  })
}

//template
function functionName(parameters, callback){
  var query = ``;
  
  sqlDB.query(query, (err, res) => {
      if (err) throw err;
      else callback(err,res.rows)
  })
}



module.exports.removeRiderFromSelection = removeRiderFromSelection
module.exports.addAccount = addAccount
module.exports.addRiderToSelection = addRiderToSelection