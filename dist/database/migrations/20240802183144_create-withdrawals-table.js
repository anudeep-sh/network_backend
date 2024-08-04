"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('withdrawals', function (table) {
        table.uuid('id').primary();
        table.uuid('user_id').references('id').inTable('users').notNullable();
        table.decimal('amount', 10, 2).notNullable();
        table.string('status').notNullable(); // e.g., "pending", "approved", "rejected"
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
}
async function down(knex) {
}
//# sourceMappingURL=20240802183144_create-withdrawals-table.js.map