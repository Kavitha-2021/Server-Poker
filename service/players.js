const db = require('../dbconfig')

module.exports = PlayerService = {
    getAll: async() => {
        const users = await db('players')
        return users;
    },
    getByName: async(name) => {
        const user = await db('players').where("username", name);
        return user;
    },
    createUser: async(user) => {
        const c_user = await db('players').insert(user);
        return c_user
    },
    updateUser: async(user) => {
        const {username, firstname, password} = user

        const u_user = await db('players').where("username", username).update({
            username, firstname, password
        })

        return u_user
    },
    deleteUser: async(id) => {
        const d_user = await db('players').where('id', id).del();
        return d_user
    }
}