module.exports = {
    /** Returns query for previous classifications
     * @param {number} race_id
     * @param {number} stagenr
     * @param {number} account_id
     * @param {boolean} budgetParticipation
     * @return {string}
     */
    prevClassificationsQuery: (race_id: number, stagenr: number, account_id: number, budgetParticipation: boolean): string => {
        var stage_id = `(SELECT stage_id FROM stage WHERE race_id=${race_id} AND stagenr= ${stagenr})`;
        var account_participation_id = `(SELECT account_participation_id FROM account_participation 
                                    WHERE account_id=${account_id} AND race_id=${race_id} AND budgetparticipation=${budgetParticipation})`;
        var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id})`

        var inSelection = `CASE WHEN rider_participation.rider_participation_id IN (SELECT rider_participation_id FROM stage_selection_rider WHERE stage_selection_id = ${stage_selection_id}) THEN 'bold black' ELSE '' END`
        var inteam = `CASE WHEN rider_participation.rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id}) THEN 'bold gray' ELSE '' END`
        var rowClassName = `CONCAT(${inSelection},' ', ${inteam}) AS "rowClassName"`;
        var stage_idPrev = `(SELECT stage_id FROM stage WHERE race_id=${race_id} AND stagenr= ${stagenr - 1})`;
        var name = `CONCAT(firstname, ' ', lastname) AS "Name"`
        var link = `CONCAT('/rider/',rider_participation.rider_id) AS "Name_link"`
        var team = `team AS "Team"`

        var classifications = [
            { pos: 'gcpos', result: 'gcresult AS "Time"' },
            { pos: 'pointspos', result: 'pointsresult AS "Points"' },
            { pos: 'kompos', result: 'komresult AS "Points"' },
            { pos: 'yocpos', result: 'yocresult AS "Time"' },
        ];
        var query = '';
        for (var j in classifications) {
            var classificationQuery = `SELECT ${classifications[j].pos} AS " ", ${link}, ${name}, ${team}, ${classifications[j].result}, ${rowClassName}
                                FROM results_points
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                WHERE stage_id=${stage_idPrev} AND ${classifications[j].pos} > 0 
                                ORDER BY " " ASC
                                LIMIT 5;\n `;
            query += classificationQuery;
        }
        return query;
    }
}