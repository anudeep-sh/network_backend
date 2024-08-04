"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('users', function (table) {
        table.uuid('id').primary(); // Primary Key
        table.string('shortcode').unique().notNullable(); // Unique 6-digit code
        table.string('name').notNullable();
        table.string('emailId').unique().notNullable();
        table.string('password').notNullable();
        table.string('status').notNullable();
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
}
async function down(knex) {
}
//# sourceMappingURL=20240802182617_create-users-table.js.map