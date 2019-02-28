// Initialize connection
var fs = require('fs');

if (fs.existsSync('./server/db/sqlDBlink.js')) {
    var sqlDBstring = require('./sqlDBlink.js'); //Ik snap niet waarom dit zo is
} else {
    var sqlDBstring = process.env.DATABASE_URL;
}

const { Client } = require('pg');
var sqlDB = new Client({
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

/** Adds a rider to the database
 * @param {String} pcsid
 * @param {String} country
 * @param {String} firstname
 * @param {String} lastname
 * @param {String} initials
 * @param {Function} callback
 */
function addRiderToDatabase (pcs_id, country, firstname, lastname, initials, callback) {
  var values = [pcs_id, country, firstname, lastname, initials];
  var query = `INSERT INTO rider(pcs_id, country, firstname, lastname, initials)
  VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (pcs_id) 
  DO UPDATE SET pcs_id = EXCLUDED.pcs_id, country = EXCLUDED.country, firstname = EXCLUDED.firstname, lastname = EXCLUDED.lastname, initials = EXCLUDED.initials
  RETURNING rider_id`;
  sqlDB.query(query, values, (err, res) => {
    if (err) throw err;
    else{
      console.log("%s %s INSERTED INTO rider", res.rows.rider, pcs_id)
      callback(err, res.rows.rider)
    }
  });
}

/** Adds a rider to a race
 * @param {String} race_id
 * @param {String} rider_id
 * @param {String} price
 * @param {String} team
 * @param {Function} callback
 */
function addRiderToRace (race_id, rider_id, price, team, callback) {
  var values = [race_id, rider_id, price, team];
  var query = `INSERT INTO rider_participation (race_id,rider_id,price,team) 
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (race_id,rider_id) 
  DO UPDATE SET race_id = EXCLUDED.race_id, rider_id = EXCLUDED.rider_id, price = EXCLUDED.price, team = EXCLUDED.team
  RETURNING rider_participation_id`;
  sqlDB.query(query, values, (err, res) => {
    if (err) throw err;
    else{
      console.log("%s %s INSERTED INTO rider_participation", rider_participation_id, rider_id)
      callback(err, res.rows[0].rider_participation)
    }
  });
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
module.exports.addRiderToDatabase = addRiderToDatabase
module.exports.addRiderToRace = addRiderToRace