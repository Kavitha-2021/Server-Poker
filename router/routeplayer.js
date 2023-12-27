const express = require('express')
const Route = express.Router();
const controller = require('../controller/controlplayer')

Route.route('/').get((req, res) => {
    res.send('Hello')
})

Route
    .post('/player', controller.addUser)
    .get('/player', controller.getAllUser)
    .post('/playerauth', controller.loginUser)

module.exports = Route