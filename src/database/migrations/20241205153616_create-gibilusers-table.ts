import knex, { type Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('gibilusers', function(table) {
        table.uuid('id').primary(); // Primary Key
        table.string('refno').notNullable(); // Unique 6-digit code
        table.string('ak').notNullable();
        table.string('urc').notNullable();
        table.string('umc').notNullable();
        table.string('email').notNullable();
        table.string('fname').nullable();
        table.string('lname').nullable();
        table.string('phno').nullable();
        table.string('pin').nullable();
        table.string('adh').nullable();
        table.string('pan').nullable();
        table.string('pampt').nullable();
        table.string('pstatus').nullable()
        table.string('ptype').nullable()
        table.string('od_amt').nullable()
        table.string('payout').nullable()
        table.string('retailer_payout').nullable()
        table.string('distributor_payout').nullable()
        table.timestamp('reqtime').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
      });
}


export async function down(knex: Knex): Promise<void> {
}

