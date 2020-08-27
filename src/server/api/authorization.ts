module.exports = (app) => {
    const jwt = require('jsonwebtoken');
    const fs = require('fs');
    const refreshtoken = require('../db/Mongo/models/refreshtoken');

    function getSecret() {
        let secret;
        if (fs.existsSync('./src/server/jwtsecret.js')) {
            secret = require('../jwtsecret');
        } else {
            secret = process.env.JWT_SECRET;
        }
        return secret;
    }

    app.use( (req, res, next) => {
        // Check whether the page needs authentication
        if (req.url === '/api/login' || req.url === '/api/signup' || req.url === '/api/getinitialdata') {
            next();
        } else {
            // get the token from the header if present
            const token = req.headers.authorization;
            // if no token found
            if (token === 'null') {
                console.log('no token')
                return res.status(401).send('Access denied. No token provided.');
            } else {
                // if can verify the token, set req.user and pass to next middleware
                const expiredToken = jwt.decode(token); // Lees de info uit de expired token
                jwt.verify(token, getSecret(), (err, decoded) => {
                    if (err) {
                        if (err.name === 'TokenExpiredError') {
                            refreshtoken.find({ account_id : expiredToken.account_id}, (err2, result) => {
                                if (err2) { throw err; }
                                if (!result) {
                                    return res.status(401).send('Access denied. No token provided.');
                                } else {
                                    // Maak de authtoken aan met juiste string
                                    const newToken = jwt.sign({
                                        account_id: expiredToken.account_id,
                                        email: expiredToken.email,
                                        admin: expiredToken.admin,
                                        refreshString: result.refreshString,
                                    }, getSecret(), { expiresIn: 60 * 60 });
                                    res.append('authorization', newToken);
                                    return res.status(498).send('Expired token');
                                }
                            });
                        }
                    } else {
                        // Plak het user object aan de req
                        req.user = decoded;
                        next();
                    }
                });
            }
        }
    });
};
