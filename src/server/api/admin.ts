module.exports = (app) => {
    const sqlDB = require('../db/sqlDB');

    app.post('/api/admin/query', (req, res) => {
        if (req.user.admin) {
            const sqlQuery = req.body.query;
            sqlDB.query(sqlQuery,
                (err, sqlres) => {
                    if (err) {
                        // tslint:disable-next-line: no-console
                        console.log(sqlQuery);
                        // tslint:disable-next-line: no-console
                        console.log('ERROR');
                        // tslint:disable-next-line: no-console
                        console.log(err);
                        // tslint:disable-next-line: no-console
                        console.log(err.toString());
                        res.send({ errorBool: true, data: err, error: err.toString() });
                    } else {
                        // tslint:disable-next-line: no-console
                        console.log('Query: ');
                        // tslint:disable-next-line: no-console
                        console.log(sqlQuery);
                        // tslint:disable-next-line: no-console
                        console.log('RESPONSE');
                        // tslint:disable-next-line: no-console
                        console.log(sqlres);
                        res.send({ data: sqlres });
                    }
                });
        } else {
            return res.status(401).send('Access denied. No admin');
        }
    });

    app.post('/api/admin/getdbinfo', (req, res) => {
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
            sqlDB.query(totalQuery,
                (err, sqlres) => {
                    if (err) {
                        // tslint:disable-next-line: no-console
                        console.log('WRONG QUERY:', totalQuery);
                        throw err;
                    } else {
                        const sum = { Tables: 'Totaal', Rows: 0, Inserts: 0, Updates: 0, Deletions: 0 };
                        sqlres[0].rows.forEach((row) => {
                            sum.Rows += parseInt(row.Rows, 10);
                            sum.Inserts += parseInt(row.Inserts, 10);
                            sum.Updates += parseInt(row.Updates, 10);
                            sum.Deletions += parseInt(row.Deletions, 10);
                        });
                        sqlres[0].rows.push(sum);
                        res.send({ tables: sqlres, titles });
                    }
                });


        } else {
            return res.status(401).send('Access denied. No admin');
        }
    });
}
