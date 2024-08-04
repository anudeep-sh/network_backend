"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = require("knex");
const database_connection_1 = require("./database.connection");
const config = database_connection_1.default[process.env.NODE_ENV || "development"];
const db = (0, knex_1.default)(config);
exports.default = db;
//# sourceMappingURL=db.js.map