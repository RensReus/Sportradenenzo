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
        var sqlQuery = req.body.query;
        jwt.verify(req.body.token, getSecret(), function (err, decoded) {
            if (!err && decoded.admin) {
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
                            res.send({ 'data': sqlres });
                        }
                    })
            }
        });
    });
}
