import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("options_for_forms", function (table) {
    table.uuid("id").primary();
    table.string("form_type").notNullable();
    table.string("form_field").notNullable();
    table.jsonb("options").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.unique(["form_type", "form_field"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("options_for_forms");
}
