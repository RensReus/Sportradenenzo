module.exports = {
    /** Returns the account object from db
     * @param {number} account_id account id
     */
    getAccount: async function (account_id: number) {
        var query = `SELECT account_id, username, email, admin FROM account
                WHERE account_id = ${account_id}`;
        return await sqlDB.query(query);
    },

    /** Returns all riders for a given account/race/year
     * @param {String} account_id
     * @param {boolean} budgetParticipation
     * @param {number} race_id 
     */
    getTeamSelection: async function (account_id: string, budgetParticipation: boolean, race_id: number) {
        var values = [account_id, race_id, budgetParticipation];//$1,$2,$3
        var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = $2 AND budgetParticipation = $3)`;
        var teamselection = `(SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id})`;
        var query = `SELECT rider.firstname, rider.lastname, price, team, rider_participation_id, dnf FROM rider_participation
        INNER JOIN rider using(rider_id)
        WHERE rider_participation_id IN ${teamselection}
        ORDER BY dnf, price DESC`;
        return await sqlDB.query(query, values);
    },

    /** Returns all riders for a given race/year
     * @param {number} race_id
     */
    getAllRiders: async function (race_id: number) {
        var values = [race_id];
        var query = `SELECT rider.firstname || ' ' || rider.lastname as name, price, team, rider_participation_id FROM rider_participation
                INNER JOIN rider using(rider_id)
                WHERE race_id = $1
                ORDER BY price DESC`;
        return await sqlDB.query(query, values);
    },

    /**Returns account belonging to email
     * @param {String} email
     */
    getLogin: async function (email: string) {
        var values = [email]
        var query = `SELECT * FROM account WHERE email = $1`;
        return await sqlDB.query(query, values);
    },

    /**Returns race
     * @param {number} race_id
     */
    getRace: async function (race_id: number) {
        var values = [race_id];
        var query = `SELECT * FROM race 
                WHERE race_id = $1`;
        return await sqlDB.query(query, values);
    }
}