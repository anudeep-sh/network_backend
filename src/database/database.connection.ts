import { Knex } from 'knex';

interface IKnexConfig {
  [key: string]: Knex.Config;
}

const configs: IKnexConfig = {
  development: {
    client: 'postgres',
    connection: async () => {
      return {
        host: 'localhost',
        user: 'alakanav',
        password: `1234`,
        database: 'network',
        port: 5432,
      };
    },
    debug: true,
    useNullAsDefault: true,
    pool: {
      min: 2,
      max: 20,
      propagateCreateError: false,
    },
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'educate',
      user: 'username',
      password: '1',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'educate',
    },
  },
};

export default configs;