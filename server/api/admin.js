const jwt = require('jsonwebtoken')  
const fs = require('fs');

function getSecret() {
    if (fs.existsSync('./server/jwtsecret.js')) {
        return secret = require('../jwtsecret');
    } else {
        return secret = process.env.JWT_SECRET;
    }
}

module.exports = function (app) {
    const sqlDB = require('../db/sqlDB')

    app.post('/api/admin', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, decoded) {
            if (!err && decoded.admin) {
                var sqlQuery = req.body.query;
                sqlDB.query(sqlQuery,
                    (err, sqlres) => {
                        if (err) {
                            console.log(sqlQuery);
                            console.log("ERROR");
                            console.log(err);
                            console.log(err.toString())
                            res.send({ errorBool: true,data: err , error: err.toString()});
                        }
                        else {
                            console.log("Query: ");
                            console.log(sqlQuery);
                            console.log("RESPONSE");
                            console.log(sqlres);
                            res.send({ 'data': sqlres });
                        }
                    })
            }
        });
    });

    app.post('/api/getdbinfo', function(req,res){
        jwt.verify(req.body.token, getSecret(), function (err, decoded) {
            if (!err && decoded.admin) {
                var allTableSizesQuery = `SELECT relname "Table", n_live_tup AS "Rows", n_tup_ins AS "Inserts", n_tup_upd AS "Updates", n_tup_del AS "Deletions"
                FROM pg_stat_user_tables 
                ORDER BY "Rows" DESC; `;

                var stage_selection_riderQuery = `SELECT COUNT(*) AS "Rows", name, year FROM stage_selection_rider
                INNER JOIN stage_selection USING(stage_selection_id)
                INNER JOIN stage USING(stage_id)
                INNER JOIN race USING(race_id)
                GROUP BY name, year; `;

                var results_pointsQuery = `SELECT COUNT(*) AS "Rows", name, year FROM results_points
                INNER JOIN stage USING(stage_id)
                INNER JOIN race USING(race_id)
                GROUP BY name, year; `;

                var rider_participationQuery = `SELECT COUNT(*) AS "Rows", name, year FROM rider_participation
                INNER JOIN race USING(race_id)
                GROUP BY name, year; `;

                var team_selection_riderQuery = `SELECT COUNT(*) AS "Rows", name, year FROM team_selection_rider
                INNER JOIN account_participation USING(account_participation_id)
                INNER JOIN race USING(race_id)
                GROUP BY name, year; `;

                var stage_selectionQuery = `SELECT COUNT(*) AS "Rows", name, year FROM stage_selection
                INNER JOIN stage USING(stage_id)
                INNER JOIN race USING(race_id)
                GROUP BY name, year; `;
                var titles = ["All Table Sizes", "stage_selection_rider", "results_points", "rider_participation", "team_selection_rider", "stage_selection"]
                var totalQuery = allTableSizesQuery + stage_selection_riderQuery + results_pointsQuery + rider_participationQuery + team_selection_riderQuery + stage_selectionQuery;
                sqlDB.query(totalQuery,
                    (err, sqlres) => {
                        if (err) {console.log("WRONG QUERY:",totalQuery); throw err;}          
                        else {
                            var sum = {'Tables':'Totaal','Rows':0,'Inserts':0,'Updates':0,'Deletions':0}
                            sqlres[0].rows.forEach(function(row){
                                sum.Rows += parseInt(row.Rows);
                                sum.Inserts += parseInt(row.Inserts);
                                sum.Updates += parseInt(row.Updates);
                                sum.Deletions += parseInt(row.Deletions);
                            })
                            sqlres[0].rows.push(sum)
                            res.send({ tables: sqlres, titles });
                        }
                    })


            }
        })
    })
}
