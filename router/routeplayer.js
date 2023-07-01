const express = require('express')
const Route = express.Router();
const controller = require('../controller/controlplayer')

Route
    .post('/player', controller.addUser)
    .get('/player', controller.getAllUser)
    .post('/playerauth', controller.loginUser)

module.exports = Route