import knex, { type Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('wallet_history', function(table) {
        table.uuid('id').primary();
        table.uuid('user_id').references('id').inTable('users').notNullable();
        table.decimal('amount', 10, 2).notNullable();
        table.string('type').notNullable(); // e.g., "credit", "debit", "withdrawal"
        table.timestamp('timestamp').defaultTo(knex.fn.now());
      });
}


export async function down(knex: Knex): Promise<void> {
}

