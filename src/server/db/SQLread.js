const sqlDB = require('./sqlDB')
// TODO remove callbacks
// todo Maybe remove whole file? maar de styling met params en typing is nice

module.exports = {
    /** Returns the account object from db
     * @param {number} account_id account id
     * @param {function} callback 
     */
    getAccount: async function (account_id, callback) {
        var query = `SELECT account_id, username, email, admin FROM account
                WHERE account_id = ${account_id}`;

        const res = await sqlDB.query(query);
        callback(null, res.rows[0])
    },

    /** Returns all riders for a given account/race/year
     * @param {String} account_id
     * @param {boolean} budgetParticipation
     * @param {number} race_id 
     * @param {function} callback
     * @returns {Array} array of riders [{ name: , price: , team: ,rider_participation: },...]
     */
    getTeamSelection: async function (account_id, budgetParticipation, race_id, callback) {
        var values = [account_id, race_id, budgetParticipation];//$1,$2,$3
        var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = $2 AND budgetParticipation = $3)`;
        var teamselection = `(SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id})`;
        var query = `SELECT rider.firstname, rider.lastname, price, team, rider_participation_id, dnf FROM rider_participation
        INNER JOIN rider using(rider_id)
        WHERE rider_participation_id IN ${teamselection}
        ORDER BY dnf, price DESC`;

        const res = await sqlDB.query(query, values);
        callback(res.rows);
    },

    /** Returns all riders for a given race/year
     * @param {number} race_id
     * @param {function} callback
     * @returns {Array} array of riders [{ name: , price: , team: ,rider_participation: },...]
     */
    getAllRiders: async function (race_id, callback) {
        var values = [race_id];
        var query = `SELECT rider.firstname || ' ' || rider.lastname as name, price, team, rider_participation_id FROM rider_participation
                INNER JOIN rider using(rider_id)
                WHERE race_id = $1
                ORDER BY price DESC`;

        const res = await sqlDB.query(query, values);
        callback(res.rows);
    },

    /** Return the information about the rider and his 
     * @param {number} rider_participation_id 
     * @param {function} callback 
     */
    getRider: async function (rider_participation_id, callback) {
        var values = [rider_participation_id];
        var query = `SELECT * FROM rider_participation
                INNER JOIN rider using(rider_id)
                WHERE rider_participation_id = $1`;

        const res = await sqlDB.query(query, values);
        callback(res.rows[0])
    },

    /**Returns account belonging to email
     * @param {String} email
     * @param {function} callback
     */
    getLogin: async function (email, callback) {
        var values = [email]
        var query = `SELECT * FROM account WHERE email = $1`;

        const res = await sqlDB.query(query, values);
        callback(res.rows[0])
    },

    /**Returns race
     * @param {number} race_id
     * @param {function} callback 
     */
    getRace: async function (race_id, callback) {
        var values = [race_id];
        var query = `SELECT * FROM race 
                WHERE race_id = $1`;

        const res = await sqlDB.query(query, values);
        callback(res.rows[0])
    },

    /**Returns the participation_id if a user is participating in a race
     * @param {String} account_id
     * @param {String} race_id
     * @param {Function} callback 
     */
    getUserRaceParticipation: async function (account_id, race_id, callback) {
        var values = [account_id, race_id];
        var query = `SELECT account_participation_id FROM account_participation 
                WHERE account_id = $1 AND race_id = $2`;
        const res = await sqlDB.query(query, values);
        callback(res.rows[0])
    },

    //template
    functionName: async function (parameters, callback) {
        var values = [parameters] // $1, ...
        var query = ``;

        const res = await sqlDB.query(query, values);
        callback(res.rows);
    }
}