module.exports = {
  /**
   * @param {number} rider_participation_id
   * @param {number} account_id
   * @param {boolean} budgetParticipation
   * @param {number} race_id
   */
  addRiderToSelection: async (rider_participation_id: number, account_id: number, budgetParticipation: boolean, race_id: number) => {
    const values = [rider_participation_id, account_id, race_id, budgetParticipation];
    const account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $2 AND race_id = $3 AND budgetParticipation = $4)`;
    const query = `INSERT INTO team_selection_rider(rider_participation_id,account_participation_id)
              VALUES($1,${account_participation_id})`;
    return await sqlDB.query(query, values);
  },

  /** Removes a rider from team selection
   * @param {number} account_id
   * @param {number} rider_participation_id
   * @param {boolean} budgetParticipation
   * @param {number} race_id
   */
  removeRiderFromSelection: async (account_id: number, rider_participation_id: number, budgetParticipation: boolean, race_id: number) => {
    const values = [account_id, rider_participation_id, race_id, budgetParticipation];
    const account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = $3 AND budgetParticipation = $4)`;
    const query = `DELETE FROM team_selection_rider
              WHERE account_participation_id = ${account_participation_id}
              AND rider_participation_id = $2`;
    return await sqlDB.query(query, values);
  },

  /** Adds a rider to the database
   * @param {String} pcsid
   * @param {String} country
   * @param {String} firstname
   * @param {String} lastname
   * @param {String} initials
   */
  addRiderToDatabase: async (pcs_id, country: string, firstname: string, lastname: string, initials: string) => {
    const values = [pcs_id, country, firstname, lastname, initials];
    const query = `INSERT INTO rider(pcs_id, country, firstname, lastname, initials)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (pcs_id)
    DO UPDATE SET pcs_id = EXCLUDED.pcs_id, country = EXCLUDED.country, firstname = EXCLUDED.firstname, lastname = EXCLUDED.lastname, initials = EXCLUDED.initials
    RETURNING rider_id`;
    return await sqlDB.query(query, values);
  },

  /** Adds a rider to a race
   * @param {String} race_id
   * @param {String} rider_id
   * @param {String} price
   * @param {String} team
   */
  addRiderToRace: async (race_id: string, rider_id: string, price: string, team: string) => {
    const values = [race_id, rider_id, price, team];
    const query = `INSERT INTO rider_participation (race_id,rider_id,price,team)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (race_id,rider_id)
    DO UPDATE SET race_id = EXCLUDED.race_id, rider_id = EXCLUDED.rider_id, price = EXCLUDED.price, team = EXCLUDED.team
    RETURNING rider_participation_id`;
    return await sqlDB.query(query, values);
  },

  /**add a new account to the database and returns it
   * @param {String} email
   * @param {String} password
   */
  addAccount: async (email: string, password: string) => {
    const values = [email, password];
    const query = `INSERT INTO account(email, password)
              VALUES($1, $2)
              RETURNING *`;
    return await sqlDB.query(query, values);
  },

  /**
   * @param {number} account_id
   * @param {number} race_id
   */
  addAccount_participation: async (account_id: number, race_id: number) => {
    const values = [account_id, race_id];
    const query = `INSERT INTO account_participation(account_id, race_id)
              VALUES($1, $2)
              RETURNING *`;
    return await sqlDB.query(query, values);
  }
}