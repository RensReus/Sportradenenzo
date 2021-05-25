//In dit bestand staan alle calls die betrekking hebben tot de resultaten van een stage
const sqlDB = require('../db/sqlDB')

module.exports = function (app) {
  app.post('/api/setkopman', async (req, res) => {
    var budgetParticipation = req.body.budgetParticipation == 1;
    var race_id = req.body.race_id;
    var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${req.user.account_id} AND race_id = ${race_id} AND budgetParticipation = ${budgetParticipation})`;
    var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=${req.body.stage} AND race_id=${race_id})`
    var selectionCompleteQuery = selectionsCompleteQuery(race_id, req.body.stage, req.user.account_id);
    var query = `UPDATE stage_selection
                            SET kopman_id=${req.body.rider_participation_id}
                            WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id};\n `;
    query += selectionCompleteQuery;
    const results = await sqlDB.query(query);
    res.send({
      'kopman': req.body.rider_participation_id,
      selectionsComplete: results[1].rows.map(x => x.complete)
    })
  });

  app.post('/api/removekopman', async (req, res) => {
    console.log('called removekopman')
    var budgetParticipation = req.body.budgetParticipation == 1;
    var race_id = req.body.race_id;
    var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=${req.body.stage} AND race_id=${race_id})`
    var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${req.user.account_id} AND race_id = ${race_id} AND budgetParticipation = ${budgetParticipation})`;
    var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE stage_id = ${stage_id} AND account_participation_id = ${account_participation_id})`
    var selectionCompleteQuery = selectionsCompleteQuery(race_id, req.body.stage, req.user.account_id);
    var removeQuery = `UPDATE stage_selection SET kopman_id = NULL WHERE stage_selection_id = ${stage_selection_id} AND kopman_id = ${req.body.rider_participation_id};\n`
    var query = removeQuery + selectionCompleteQuery;
    const results = await sqlDB.query(query);

    res.send({
      kopman: null,
      selectionsComplete: results[1].rows.map(x => x.complete)
    })
  });

  app.post('/api/removeriderfromstage', async (req, res) => {
    var budgetParticipation = req.body.budgetParticipation == 1;
    var race_id = req.body.race_id;
    var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${req.user.account_id} AND race_id = ${race_id} AND budgetParticipation = ${budgetParticipation})`;
    var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=${req.body.stage} AND race_id=${race_id})`
    var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id})`
    var removeKopmanQuery = `UPDATE stage_selection SET kopman_id = NULL WHERE stage_selection_id = ${stage_selection_id} AND kopman_id = ${req.body.rider_participation_id};\n  `;
    var removeRiderQuery = `DELETE FROM stage_selection_rider
                            WHERE stage_selection_id=${stage_selection_id} AND rider_participation_id=${req.body.rider_participation_id};\n `;

    removeRiderQuery += removeKopmanQuery;
    await sqlDB.query(removeRiderQuery);
    var race_id = req.body.race_id;
    var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${req.user.account_id} AND race_id = ${race_id} AND budgetParticipation = ${budgetParticipation})`;
    var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=${req.body.stage} AND race_id=${race_id})`
    var stage_selection_riderQuery = `SELECT * FROM stage_selection_rider
                                        INNER JOIN stage_selection USING (stage_selection_id)
                                        INNER JOIN rider_participation USING (rider_participation_id)
                                        INNER JOIN rider USING (rider_id)
                                        WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id};\n `;
    var prevClassificationQuery = prevClassificationsQuery(race_id, req.body.stage, req.user.account_id, budgetParticipation);
    var kopmanQuery = `SELECT kopman_id FROM stage_selection
                      WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id};\n `;
    var selectionCompleteQuery = selectionsCompleteQuery(race_id, req.body.stage, req.user.account_id);
    var newSelectionQuery = stage_selection_riderQuery + prevClassificationQuery + kopmanQuery + selectionCompleteQuery;

    const results = await sqlDB.query(newSelectionQuery)
    res.send({
      stageSelection: results[0].rows,
      prevClassifications: results.slice(1, 5).map(x => x.rows),
      kopman: results[5].rows[0].kopman_id,
      selectionsComplete: results[6].rows.map(x => x.complete)
    });
  });

  app.post('/api/addridertostage', async (req, res) => {
    var budgetParticipation = req.body.budgetParticipation == 1;
    var values = [req.user.account_id, budgetParticipation, req.body.stage];
    var race_id = req.body.race_id;
    var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = ${race_id} AND budgetParticipation = $2)`;
    var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=$3 AND race_id=${race_id})`
    var currentSelectionQuery = `SELECT * FROM stage_selection_rider
                            INNER JOIN stage_selection USING (stage_selection_id)
                            INNER JOIN rider_participation USING (rider_participation_id)
                            INNER JOIN rider USING (rider_id)
                            WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id}`;
    const currentSelection = await sqlDB.query(currentSelectionQuery, values)
    if (currentSelection.rows.length === 9) {
      res.send(false);
    } else {
      var values = [req.user.account_id, budgetParticipation, req.body.stage, req.body.rider_participation_id];
      var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id})`
      var addRiderQuery = `INSERT INTO stage_selection_rider (stage_selection_id, rider_participation_id)
                                            VALUES (${stage_selection_id},$4)
                                            ON CONFLICT (rider_participation_id,stage_selection_id) DO NOTHING`
      await sqlDB.query(addRiderQuery, values)
      var race_id = req.body.race_id;
      var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${req.user.account_id} AND race_id = ${race_id} AND budgetParticipation = ${budgetParticipation})`;
      var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=${req.body.stage} AND race_id=${race_id})`
      var stage_selection_riderQuery = `SELECT * FROM stage_selection_rider
                                            INNER JOIN stage_selection USING (stage_selection_id)
                                            INNER JOIN rider_participation USING (rider_participation_id)
                                            INNER JOIN rider USING (rider_id)
                                            WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id};\n `;
      var prevClassificationQuery = prevClassificationsQuery(race_id, req.body.stage, req.user.account_id, budgetParticipation);
      var kopmanQuery = `SELECT kopman_id FROM stage_selection
                      WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id};\n `;
      var selectionCompleteQuery = selectionsCompleteQuery(race_id, req.body.stage, req.user.account_id);

      var newSelectionPageQuery = stage_selection_riderQuery + prevClassificationQuery + kopmanQuery + selectionCompleteQuery;
      const results = await sqlDB.query(newSelectionPageQuery)
      res.send({
        stageSelection: results[0].rows,
        prevClassifications: results.slice(1, 5).map(x => x.rows),
        kopman: results[5].rows[0].kopman_id,
        selectionsComplete: results[6].rows.map(x => x.complete)
      });
    }
  });

  var selectionsCompleteQuery = function (race_id, stagenr, account_id) {
    var account_participation_id = `(SELECT account_participation_id FROM account_participation 
      WHERE account_id=${account_id} AND race_id=${race_id})`;
    var stage_id = `(SELECT stage_id FROM stage WHERE race_id=${race_id} AND stagenr= ${stagenr})`;
    var query = `SELECT COUNT(rider_participation_id) + CASE WHEN kopman_id IS NULL THEN 0 ELSE 1 END AS "complete", stage_selection_id, budgetparticipation FROM stage_selection 
    LEFT JOIN stage_selection_rider USING (stage_selection_id )
    INNER JOIN account_participation USING (account_participation_id )
    INNER JOIN race USING (race_id) 
    WHERE account_participation_id IN ${account_participation_id} AND stage_id = ${stage_id}
    GROUP BY stage_selection_id, kopman_id, budgetparticipation 
    ORDER BY budgetparticipation;\n `
    return query
  }
}

