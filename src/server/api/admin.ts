module.exports = (app) => {
  const sqlDB = require('../db/sqlDB');
  // const sqlDBnew = require('../db/sqlDBnew');

  app.post('/api/admin/query', async (req, res) => {
    if (req.user.admin) {
      const sqlQuery = req.body.query;
      var response = await sqlDB.query(sqlQuery, [], true);
      if (response.error) {
        res.send({ errorBool: true, data: response.error, error: response.error.toString() });
      } else {
        res.send({ data: response });
      }
    } else {
      return res.status(401).send('Access denied. No admin');
    }
  });

  app.post('/api/admin/getdbinfo', async (req, res) => {
    if (req.user.admin) {
      const allTableSizesQuery = `SELECT relname "Table", n_live_tup AS "Rows", n_tup_ins AS "Inserts", n_tup_upd AS "Updates", n_tup_del AS "Deletions"
                FROM pg_stat_user_tables
                ORDER BY "Rows" DESC; `;

      const stageSelectionRiderQuery = `SELECT COUNT(*) AS "Rows", name, year FROM stage_selection_rider
                INNER JOIN stage_selection USING(stage_selection_id)
                INNER JOIN stage USING(stage_id)
                INNER JOIN race USING(race_id)
                GROUP BY name, year; `;

      const resultsPointsQuery = `SELECT COUNT(*) AS "Rows", name, year FROM results_points
                INNER JOIN stage USING(stage_id)
                INNER JOIN race USING(race_id)
                GROUP BY name, year; `;

      const riderParticipationQuery = `SELECT COUNT(*) AS "Rows", name, year FROM rider_participation
                INNER JOIN race USING(race_id)
                GROUP BY name, year; `;

      const teamSelectionRiderQuery = `SELECT COUNT(*) AS "Rows", name, year FROM team_selection_rider
                INNER JOIN account_participation USING(account_participation_id)
                INNER JOIN race USING(race_id)
                GROUP BY name, year; `;

      const stageSelectionQuery = `SELECT COUNT(*) AS "Rows", name, year FROM stage_selection
                INNER JOIN stage USING(stage_id)
                INNER JOIN race USING(race_id)
                GROUP BY name, year; `;
      const titles = ['All Table Sizes', 'stage_selection_rider', 'results_points', 'rider_participation', 'team_selection_rider', 'stage_selection'];
      // tslint:disable-next-line: max-line-length
      const totalQuery = allTableSizesQuery + stageSelectionRiderQuery + resultsPointsQuery + riderParticipationQuery + teamSelectionRiderQuery + stageSelectionQuery;
      
      let sqlres = await sqlDB.query(totalQuery);
      
      const sum = { Tables: 'Totaal', Rows: 0, Inserts: 0, Updates: 0, Deletions: 0 };
      sqlres[0].rows.forEach((row) => {
        sum.Rows += parseInt(row.Rows, 10);
        sum.Inserts += parseInt(row.Inserts, 10);
        sum.Updates += parseInt(row.Updates, 10);
        sum.Deletions += parseInt(row.Deletions, 10);
      });
      sqlres[0].rows.push(sum);
      
      res.send({ tables: sqlres, titles });
    } else {
      return res.status(401).send('Access denied. No admin');
    }
  });

  // app.post('/api/admin/copytonewdb', (req, res) => {
  //   if (req.user.admin) {
  //     var selectQuery = `SELECT * FROM ${req.body.tableName}`
  //     sqlDB.query(selectQuery, (err,results)=>{
  //       if (err) {
  //         // tslint:disable-next-line: no-console
  //         console.log('WRONG QUERY:', selectQuery);
  //         throw err;
  //       }
  //       var insertQuery = `INSERT INTO ${req.body.tableName} VALUES`
  //       results.rows.forEach(row => {
  //         var newRow = ``
  //         var i = 0;
  //         for (const [key, value] of Object.entries(row)) {
  //           if (value === null){
  //             newRow += ` ${value},`
  //           }else if (value === ""){
  //             newRow += ` ' ',`
  //           }else if (key === 'starttime') {
  //             var d = (value as Date)
  //             var newval = `'${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}T${d.getHours()}:${d.getMinutes()}:00 +2'`
  //             newRow += ` ${newval},`
  //           } else {
  //             // var newval = (value as string).replace("'", "''")
  //             newRow += ` '${value}',`
  //           }
  //           i++
  //         }
  //         insertQuery += `(${newRow.slice(0, -1)}),\n `
  //       });
  //       insertQuery = insertQuery.slice(0, -3)
  //       sqlDBnew.query(insertQuery,(err,insertResults)=>{
  //         if (err) {
  //           // tslint:disable-next-line: no-console
  //           console.log('WRONG QUERY:', insertQuery);
  //           throw err;
  //         }
  //         console.log("insertresults",insertResults)
  //         res.send(insertResults)
  //       })
  //     })

  //   }
  // })
}
