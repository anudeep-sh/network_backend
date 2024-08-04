"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('hub', function (table) {
        table.uuid('id').primary();
        table.string('name').notNullable();
        table.integer('level').notNullable();
        table.decimal('price', 10, 2).notNullable();
    });
}
async function down(knex) {
}
//# sourceMappingURL=20240802182916_create-hub-table.js.map