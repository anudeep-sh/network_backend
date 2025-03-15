import knex, { type Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("users", function (table) {
    table.uuid("id").primary(); // Primary Key
    table.string("shortcode").unique().notNullable(); // Unique 6-digit code
    table.string("name").notNullable();
    table.string("emailId").unique().notNullable();
    table.string("password").notNullable();
    table.string("status").notNullable();
    table.string("pan_number").nullable();
    table.string("aadhar_number").nullable();
    table.string("bank_account_number").nullable();
    table.string("ifsc_code").nullable();
    table.string("upi_linkedin_number").nullable();
    table.timestamp("timestamp").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {}
