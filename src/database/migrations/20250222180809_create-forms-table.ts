import knex, { type Knex } from "knex";
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("forms", function (table) {
    table.uuid("id").primary();
    table.string("first_name").nullable();
    table.string("last_name").nullable();
    table.string("email").nullable();
    table.string("phone_number").nullable();
    table.date("date_of_birth").nullable();
    table.string("country").nullable();
    table.text("address").nullable();
    table.jsonb("consents_meta").nullable();
    table.jsonb("userinfo_meta").nullable();
    table.string("type").notNullable();
    table.jsonb("form_meta").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("forms");
}
