import knex, { type Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("user_quota", function (table) {
    table.integer("level5_quota").defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("users_quotas", function (table) {
    table.dropColumn("level5_quota");
  });
}
