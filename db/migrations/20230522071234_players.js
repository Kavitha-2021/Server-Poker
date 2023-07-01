exports.up = function(knex, Promise) {
    return knex.schema.createTable('players', t => {
        t.increments('id').primary()
        t.string('firstname').notNullable()
        t.string('username').unique().notNullable()
        t.string('password').notNullable()
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('players')
};
