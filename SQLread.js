// Initialize connection
var fs = require('fs');

if (fs.existsSync('./config/sqlDBlink.js')) {
    var sqlDBstring = require('./config/sqlDBlink.js');
} else {
    var sqlDBstring = process.env.DATABASE_URL;
}   
const { Client } = require('pg');
var sqlDB = new Client({
    connectionString: sqlDBstring,
    ssl: true,
});
sqlDB.connect();

/** Returns the account object from db
 * @param {int} account account id
 * @param {function} callback 
 */
function getAccount(account,callback){
    var query = `SELECT account, username, email, admin FROM account
                WHERE account = ${account}`;

    sqlDB.query(query, (err, res) => {
        if (err) throw err;
        else callback(err,res.rows[0])
    })
}


/** Returns all riders for a given account/race/year
 * @param {String} account //id of the account
 * @param {String} raceName giro/tour/vuelta
 * @param {number} year 
 * @param {function} callback
 * @returns {Array} array of riders [{ name: , price: , team: ,rider_participation: },...]
 */
function getTeamSelection(account,raceName,year,callback){
    var account_participation = `(SELECT account_participation FROM account_participation WHERE account = ${account})`;
    var race  = `(SELECT race FROM race WHERE name = '${raceName}' AND year = ${year})`;
    var teamselection = `(SELECT rider_participation FROM team_selection_rider WHERE account_participation = ${account_participation} AND race = ${race})`;
    var query = `SELECT rider.firstname, rider.lastname, price, team, rider_participation FROM rider_participation
                INNER JOIN rider using(rider)
                WHERE rider_participation IN ${teamselection}`;

    sqlDB.query(query, (err, res) => {
        if (err) throw err;
        else callback(err,res.rows)
    })
}

/** Returns all riders for a given race/year
 * @param {String} raceName giro/tour/vuelta
 * @param {number} year 
 * @param {function} callback
 * @returns {Array} array of riders [{ name: , price: , team: ,rider_participation: },...]
 */
function getAllRiders(raceName, year, callback){
    var race = `(SELECT race FROM race WHERE name = '${raceName}' AND year = ${year})`;
    var query = `SELECT rider.firstname || ' ' || rider.lastname as name, price, team, rider_participation FROM rider_participation
                INNER JOIN rider using(rider)
                WHERE race = ${race}`;
    
    sqlDB.query(query, (err, res) => {
        if (err) throw err;
        else callback(err,res.rows)
    })
}

/**Returns account belonging to email
 * @param {String} email
 * @param {function} callback
 */
function getLogin(email, callback){
    var query = `SELECT * FROM account
                WHERE email = '${email}'`;
    
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


//Exports
module.exports.getAccount = getAccount;
module.exports.getTeamSelection = getTeamSelection;
module.exports.getAllRiders = getAllRiders;
module.exports.getLogin = getLogin;