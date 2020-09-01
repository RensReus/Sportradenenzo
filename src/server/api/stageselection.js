//In dit bestand staan alle calls die betrekking hebben tot de resultaten van een stage
const sqlDB = require('../db/sqlDB')

module.exports = function (app) {
  app.post('/api/setkopman', function (req, res) {
    var budgetParticipation = req.body.budgetParticipation == 1;
    var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.racename}' AND year = ${req.body.year})`;
    var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${req.user.account_id} AND race_id = ${race_id} AND budgetParticipation = ${budgetParticipation})`;
    var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=${req.body.stage} AND race_id=${race_id})`
    var selectionCompleteQuery = selectionsCompleteQuery(race_id, req.body.stage, req.user.account_id);
    var query = `UPDATE stage_selection
                            SET kopman_id=${req.body.rider_participation_id}
                            WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id};\n `;
    query += selectionCompleteQuery;
    sqlDB.query(query, (err, sqlres) => {
      if (err) { console.log("WRONG QUERY:", query); throw err; }
      res.send({
        'kopman': req.body.rider_participation_id,
        selectionsComplete: sqlres[1].rows.map(x => x.complete)
      })
    })

  });

  app.post('/api/removekopman', function (req, res) {
    var budgetParticipation = req.body.budgetParticipation == 1;
    var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.racename}' AND year = ${req.body.year})`;
    var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=${req.body.stage} AND race_id=${race_id})`
    var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${req.user.account_id} AND race_id = ${race_id} AND budgetParticipation = ${budgetParticipation})`;
    var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE stage_id = ${stage_id} AND account_participation_id = ${account_participation_id})`
    var selectionCompleteQuery = selectionsCompleteQuery(race_id, req.body.stage, req.user.account_id);
    var removeQuery = `UPDATE stage_selection SET kopman_id = NULL WHERE stage_selection_id = ${stage_selection_id} AND kopman_id = ${req.body.rider_participation_id};\n`
    var query = removeQuery + selectionCompleteQuery;
    sqlDB.query(query, (err, sqlres) => {
      if (err) { console.log("WRONG QUERY:", query); throw err; }

      res.send({
        kopman: null,
        selectionsComplete: sqlres[1].rows.map(x => x.complete)
      })
    })
  });

  app.post('/api/removeriderfromstage', function (req, res) {
    var budgetParticipation = req.body.budgetParticipation == 1;
    var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.racename}' AND year = ${req.body.year})`;
    var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${req.user.account_id} AND race_id = ${race_id} AND budgetParticipation = ${budgetParticipation})`;
    var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=${req.body.stage} AND race_id=${race_id})`
    var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id})`
    var removeKopmanQuery = `UPDATE stage_selection SET kopman_id = NULL WHERE stage_selection_id = ${stage_selection_id} AND kopman_id = ${req.body.rider_participation_id};\n  `;
    var query = `DELETE FROM stage_selection_rider
                            WHERE stage_selection_id=${stage_selection_id} AND rider_participation_id=${req.body.rider_participation_id};\n `;

    query += removeKopmanQuery;
    sqlDB.query(query, (err, sqlres) => {
      if (err) { console.log("WRONG QUERY:", query); throw err; }
      var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.racename}' AND year = ${req.body.year})`;
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
      var query = stage_selection_riderQuery + prevClassificationQuery + kopmanQuery + selectionCompleteQuery;

      sqlDB.query(query, (err, sqlres) => {
        if (err) throw err;
        res.send({
          stageSelection: sqlres[0].rows,
          prevClassifications: sqlres.slice(1, 5).map(x => x.rows),
          kopman: sqlres[5].rows[0].kopman_id,
          selectionsComplete: sqlres[6].rows.map(x => x.complete)
        })
      });
    });
  });

  app.post('/api/addridertostage', function (req, res) {
    var budgetParticipation = req.body.budgetParticipation == 1;
    var values = [req.user.account_id, req.body.racename, req.body.year, budgetParticipation, req.body.stage];
    var race_id = `(SELECT race_id FROM race WHERE name = $2 AND year = $3)`;
    var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = ${race_id} AND budgetParticipation = $4)`;
    var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=$5 AND race_id=${race_id})`
    var query = `SELECT * FROM stage_selection_rider
                            INNER JOIN stage_selection USING (stage_selection_id)
                            INNER JOIN rider_participation USING (rider_participation_id)
                            INNER JOIN rider USING (rider_id)
                            WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id}`;
    sqlDB.query(query, values, (err, result) => {
      if (err) { console.log("WRONG QUERY:", query); throw err; }
      if (result.rows.length === 9) {
        res.send(false)
      } else {
        var values = [req.user.account_id, req.body.racename, req.body.year, budgetParticipation, req.body.stage, req.body.rider_participation_id];
        var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id})`
        var query = `INSERT INTO stage_selection_rider (stage_selection_id, rider_participation_id)
                                            VALUES (${stage_selection_id},$6)
                                            ON CONFLICT (rider_participation_id,stage_selection_id) DO NOTHING`
        sqlDB.query(query, values, (err, sqlres) => {
          if (err) throw err;
          var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.racename}' AND year = ${req.body.year})`;
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

          var query = stage_selection_riderQuery + prevClassificationQuery + kopmanQuery + selectionCompleteQuery;
          sqlDB.query(query, (err, sqlres) => {
            if (err) throw err;
            res.send({
              stageSelection: sqlres[0].rows,
              prevClassifications: sqlres.slice(1, 5).map(x => x.rows),
              kopman: sqlres[5].rows[0].kopman_id,
              selectionsComplete: sqlres[6].rows.map(x => x.complete)
            })
          });
        });
      }
    });
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

