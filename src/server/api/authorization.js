module.exports = function (app) {
    const jwt = require('jsonwebtoken')
    const fs = require('fs');
    const refreshtoken = require('../db/Mongo/models/refreshtoken')

    function getSecret() {
        if (fs.existsSync('./src/server/jwtsecret.js')) {
            return secret = require('../jwtsecret');
        } else {
            return secret = process.env.JWT_SECRET;
        }
    }

    app.use(function (req, res, next) {
        //Controleer of het om de login pagina gaat, momenteel de enige pagina waarvoor login niet verplicht is
        if (req.url == '/api/login' || req.url == '/api/signup' || req.url == '/api/getinitialdata') {
            console.log(req.url)
            next();
        } else {
            //get the token from the header if present
            const token = req.headers.authorization;
            //if no token found 
            if (!token) {
                return res.status(401).send("Access denied. No token provided.");
            } else {
                //if can verify the token, set req.user and pass to next middleware
                expiredToken = jwt.decode(token) //Lees de info uit de expired token
                jwt.verify(token, getSecret(), function (err, decoded) {
                    if (err) {  
                        if (err.name = 'TokenExpiredError') {
                            refreshtoken.find({ account_id : expiredToken.account_id}, function (err, result) {
                                if (err) throw err;
                                if (!result) {
                                    return res.status(401).send("Access denied. No token provided.");
                                } else {
                                    //Maak de authtoken aan met juiste string
                                    var newToken = jwt.sign({
                                        account_id: expiredToken.account_id,
                                        email: expiredToken.email,
                                        admin: expiredToken.admin,
                                        refreshString: result.refreshString
                                    }, getSecret(), { expiresIn: 60*60 })
                                    res.append('authorization', newToken)
                                    return res.status(498).send("Expired token")
                                }
                            })
                        }
                    }else{
                        //Plak het user object aan de req
                        req.user = decoded;
                        next();
                    }
                });
            }
        }
    })
}