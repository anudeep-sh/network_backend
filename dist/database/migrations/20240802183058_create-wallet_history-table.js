"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('wallet_history', function (table) {
        table.uuid('id').primary();
        table.uuid('user_id').references('id').inTable('users').notNullable();
        table.decimal('amount', 10, 2).notNullable();
        table.string('type').notNullable(); // e.g., "credit", "debit", "withdrawal"
        table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
}
async function down(knex) {
}
//# sourceMappingURL=20240802183058_create-wallet_history-table.js.map