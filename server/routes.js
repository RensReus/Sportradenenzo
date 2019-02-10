var path = require('path');

module.exports = function (app){
    app.get('*', (res) => {
        res.sendFile(path.resolve('./client/public/index.html'))
    })
}