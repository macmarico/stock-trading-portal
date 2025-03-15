require("dotenv").config();

module.exports = {
  development: {
    use_env_variable: "POSTGRES_URI",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true, // Required for Render PostgreSQL
        rejectUnauthorized: false,
      },
    },
  },
  test: {
    use_env_variable: "POSTGRES_URI",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
  production: {
    use_env_variable: "POSTGRES_URI",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
