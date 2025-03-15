import knex, { type Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('hub', function(table) {
        table.uuid('id').primary();
        table.string('name').notNullable();
        table.integer('level').notNullable();
        table.decimal('price', 10, 2).notNullable();
      });
}


export async function down(knex: Knex): Promise<void> {
}

