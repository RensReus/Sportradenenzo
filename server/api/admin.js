module.exports = function (app) {
    app.post('/api/admin', function (req, res) {
        // Initialize connection
        var fs = require('fs');
        if (fs.existsSync('./server/db/sqlDBlink.js')) {
            var sqlDBstring = require('../db/sqlDBlink.js');
        } else {
            var sqlDBstring = process.env.DATABASE_URL;
        }
        const { Client } = require('pg');
        const sqlDB = new Client({
            connectionString: sqlDBstring,
            ssl: true
        });

        sqlDB.connect();

        var sqlQuery = req.body.query;

        if (req.user.admin) {
            sqlDB.query(sqlQuery,
                (err, sqlres) => {
                    if (err) {
                        console.log("ERROR")
                        console.log(err);
                        res.send({ 'data': err });
                    }
                    else {
                        console.log("RESPONSE")
                        console.log(sqlres);

                        switch (sqlres.command) {
                            case 'SELECT':
                                var output = "";
                                var cols = new Array();
                                for (var i in sqlres.fields) {
                                    output += sqlres.fields[i].name + "\t";
                                    cols[i] = sqlres.fields[i].name;
                                }
                                output += "\n";
                                for (var i in sqlres.rows) {
                                    var row = sqlres.rows[i];
                                    for (var j in cols)
                                        output += row[cols[j]] + "\t";
                                    output += "\n";
                                }
                                res.send({'data': sqlres.rows});
                                break;
                            default:
                                res.send({ 'data': sqlres.command + " return not yet implemented\n" + sqlres })
                        }
                    }
                })
        }
    });
}
