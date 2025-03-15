const express = require("express");
const bodyParser = require("body-parser");
const tradeRoutes = require("./routes/tradeRoutes");
const lotRoutes = require("./routes/lotRoutes");
const authRoutes = require("./routes/authRoutes");
const { sequelize, syncDatabase } = require("./config/db");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "*", // 🔥 Allows requests from any domain
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify headers
    credentials: true, // Allow cookies & credentials (optional)
  })
);

app.use(bodyParser.json());
app.use("/api/auth", authRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/lots", lotRoutes);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Stock Trading API",
      version: "1.0.0",
      description: "API for stock trading, authentication, and user management",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Enter the token received after login in the format: Bearer <token>",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Include all route files for documentation
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const startServer = async () => {
  try {
    await syncDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(
        `Swagger docs available at http://localhost:${PORT}/api-docs`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
