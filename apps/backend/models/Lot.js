const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Lot = sequelize.define("Lot", {
  lot_id: {
    type: DataTypes.INTEGER,  // Changed from UUID to INTEGER
    autoIncrement: true,      // Enable auto-increment
    primaryKey: true,         // Set as the primary key
  },
  trade_id: { type: DataTypes.UUID, allowNull: false },
  stock_name: { type: DataTypes.STRING, allowNull: false },
  lot_quantity: { type: DataTypes.INTEGER, allowNull: false },
  realized_quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  realized_trade_id: { type: DataTypes.UUID, allowNull: true },
  lot_status: {
    type: DataTypes.ENUM("OPEN", "PARTIALLY REALIZED", "FULLY REALIZED"),
    defaultValue: "OPEN",
  },
  user_id: {
    // ✅ Added user_id to track lots per user
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Users",
      key: "user_id",
    },
    onDelete: "CASCADE",
  },
});

module.exports = Lot;
