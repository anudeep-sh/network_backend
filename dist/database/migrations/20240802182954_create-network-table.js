"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('network', function (table) {
        table.uuid('id').primary();
        table.uuid('user_id').references('id').inTable('users').notNullable();
        table.uuid('referrer_id').references('id').inTable('users').nullable();
        table.uuid('hub_id').references('id').inTable('hub').nullable();
        table.string('type').notNullable(); // e.g., "credit", "debit", "withdrawal"
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
}
async function down(knex) {
}
//# sourceMappingURL=20240802182954_create-network-table.js.map