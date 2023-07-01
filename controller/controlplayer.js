const player = require('../service/players')

module.exports.addUser = async(req, res) => {
    try {
        await player.createUser(req.body).then(resp => {
            res.status(200).json({
                message: 'User Created',
                data: req.body,
                error: {}
            })
        })
    } catch(err) {
        res.status(200).json({
            message: 'Failed to AddUser',
            data: {},
            error: err
        })
    }
}

module.exports.getAllUser = async(req, res) => {
    try {
        await player.getAll().then(resp => {
            res.status(200).json({
                message: 'Data Fetched',
                data: resp,
                error: {}
            })
        })
    } catch(err) {
        res.status(200).json({
            message: 'Failed to get Player List',
            data: {},
            error: err
        })
    }
}

module.exports.loginUser = async(req, res) => {
    try {
        const {username, password} = req.body
        await player.getByName(username).then( resp => {
            if(password == resp[0].password) {
                res.status(200).json({
                    message: 'Login Success',
                    data: resp[0],
                    error: {}
                })
            } else res.status(200).json({
                message: 'Incorrect Password',
                data: {},
                error: {}
            })
        }).catch(err => {
            res.status(200).json({
                message: 'User Not Found',
                data: {},
                error: {}
            })
        })
    }catch(err) {
        res.status(200).json({
            message: 'Login Failed',
            data: {},
            error: err
        })
    }
}