import knex, { type Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('user_quota', function(table) {
        table.uuid('id').primary(); // Primary Key
        table.uuid('user_id').references('id').inTable('users').notNullable().onDelete('CASCADE');
        table.integer('level1_quota').notNullable().defaultTo(0);
        table.integer('level2_quota').notNullable().defaultTo(0);
        table.integer('level3_quota').notNullable().defaultTo(0);
        table.integer('level4_quota').notNullable().defaultTo(0);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
}


export async function down(knex: Knex): Promise<void> {
}

