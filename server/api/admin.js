module.exports = function (app) {
    const sqlDB = require('../db/sqlDB')
    app.post('/api/admin', function (req, res) {
        var sqlQuery = req.body.query;
        if (req.user.admin) {
            sqlDB.query(sqlQuery,
                (err, sqlres) => {     
                    if (err) {
                        console.log("ERROR");
                        console.log(err);
                        res.send({ 'data': err });
                    }
                    else {
                        console.log("Query: ");
                        console.log(sqlQuery);
                        console.log("RESPONSE");
                        console.log(sqlres);
                        res.send({'data':sqlres});
                    }
                })
        }
    });
}
