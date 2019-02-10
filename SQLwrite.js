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

/**
 * 
 * @param {number} rider_participation_id 
 * @param {number} account_id 
 * @param {number} race_id 
 * @param {function} callback 
 */
function addRiderToSelection (rider_participation_id, account_id, race_id, callback) {
  var values = [rider_participation_id, account_id, raceName, race_id];
  var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $2 AND race_id = $3)`;
  var query = `INSERT INTO team_selection_rider(rider_participation_id,account_participation_id)
              VALUES($1,${account_participation_id})`;
  
  sqlDB.query(query, values, (err, res) => {
      if (err) throw err;
      else callback(err,res.rows)
  })
}


/** Removes a rider from team selection
 * @param {number} account_id
 * @param {number} rider_participation_id
 * @param {String} raceName
 * @param {int} year
 * @param {function} callback
 */
function removeRiderFromSelection (account_id, rider_participation_id, race_id, callback) {
  var values = [account_id, rider_participation_id, race_id];
  var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = $3)`;
  var query = `DELETE FROM team_selection_rider 
              WHERE account_participation_id = ${account_participation_id}))
              AND rider_participation_id = $2`;
  
  sqlDB.query(query, values, (err, res) => {
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
  var values = [email, password];
  var query = `INSERT INTO account(email, password)
              VALUES($1, $2)
              RETURNING *`;
              
  sqlDB.query(query, values, (err, res) => {
    if (err) throw err;
    else callback(err,res.rows[0])
  })
}

/**
 * 
 * @param {number} account_id 
 * @param {number} race_id 
 * @param {function} callback 
 */
function addAccount_participation(account_id, race_id, callback){
  var values = [account_id, race_id];
  var query = `INSERT INTO account_participation(account_id, race_id)
              VALUES($1, $2)
              RETURNING *`;
  
  sqlDB.query(query, values, (err, res) => {
      if (err) throw err;
      else callback(err,res.rows)
  })
}

//template
function functionName(parameters, callback){
  var values = [parameters];
  var query = ``;
  
  sqlDB.query(query, values, (err, res) => {
      if (err) throw err;
      else callback(err,res.rows)
  })
}



module.exports.removeRiderFromSelection = removeRiderFromSelection
module.exports.addAccount = addAccount
module.exports.addRiderToSelection = addRiderToSelection
module.exports.addAccount_participation = addAccount_participation