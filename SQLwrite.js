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


function addRiderToSelection (user, rider) {
  // check # of selected riders < 20
  // check renner nieuw
  // check geld
  // check 4 renners per team
}


/** Removes a rider from team selection
 * @param {number} account 
 * @param {number} rider_participation
 * @param {String} raceName
 * @param {int} year
 */
function removeRiderFromSelection (account, rider_participation, raceName, year, callback) {
  var race = `(SELECT race FROM race WHERE name = '${raceName}' and year = ${year})`
  var account_participation = `(SELECT account_participation FROM account_participation WHERE account = ${user} AND race = ${race})`
  var query = `DELETE FROM team_selection_rider 
              WHERE account_participation = ${account_participation}))
              AND rider_participation = ${rider_participation}`;
  
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