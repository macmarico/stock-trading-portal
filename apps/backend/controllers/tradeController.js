const Trade = require("../models/Trade");
const Lot = require("../models/Lot");
const { Op } = require("sequelize");
const { sequelize } = require("../config/db");

/**
 * Create a new trade (BUY or SELL) for the logged-in user
 */
exports.createTrade = async (req, res) => {
  const transaction = await sequelize.transaction(); // Start transaction

  try {
    let { stock_name, quantity, broker_name, price, trade_type } = req.body;
    const user_id = req.user.userId; // Extract user ID from JWT token
    quantity = Number(quantity);
    price = Number(price);

    if (!stock_name || !quantity || !broker_name || !price || !trade_type) {
      await transaction.rollback(); // Ensure rollback before response
      return res.status(400).json({ message: "All fields are required" });
    }

    

    if (!["BUY", "SELL"].includes(trade_type.toUpperCase())) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Invalid trade type. Must be 'BUY' or 'SELL'",
      });
    }
    

    // Create trade entry inside transaction
    const trade = await Trade.create(
      {
        stock_name,
        quantity,
        broker_name,
        price,
        trade_type: trade_type.toUpperCase(),
        user_id,
      },
      { transaction } // Ensure trade creation is part of the transaction
    );

    if (trade_type.toUpperCase() === "BUY") {
      // Create a new lot for the user within the same transaction
      await Lot.create(
        {
          trade_id: trade.trade_id,
          stock_name,
          lot_quantity: quantity,
          realized_quantity: 0,
          lot_status: "OPEN",
          user_id,
        },
        { transaction }
      );

      await transaction.commit(); // ✅ Commit everything if successful
      return res
        .status(201)
        .json({ message: "Buy trade processed successfully", trade });

    } else if (trade_type.toUpperCase() === "SELL") {
      const { method } = req.query;
      if (!method || (method !== "FIFO" && method !== "LIFO")) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "Specify method as FIFO or LIFO" });
      }

      // Pass transaction to ensure atomicity
      const success = await processSellTrade(
        stock_name,
        quantity,
        trade.trade_id,
        method,
        user_id,
        transaction
      );

      if (success) {
        await transaction.commit(); // ✅ Commit if sell was successful
        return res.status(201).json({
          message: `Sell trade processed successfully using ${method}`,
          trade,
        });
      } else {
        await transaction.rollback(); // ❌ Rollback if not enough stocks
        return res
          .status(400)
          .json({ message: "Not enough stocks available to sell" });
      }
    }
  } catch (error) {
    await transaction.rollback(); // ❌ Rollback on any error
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get all trades for the logged-in user (Admins see all trades)
 */
exports.getTrades = async (req, res) => {
  try {
    let trades;

    if (req.user.role === "admin") {
      trades = await Trade.findAll({
        order: [["createdAt", "DESC"]], 
      });
    } else {
      trades = await Trade.findAll({
        where: { user_id: req.user.userId },
        order: [["createdAt", "DESC"]],
      });
    }

    res.status(200).json(trades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
/**
 * Get a specific trade by ID (Only for the logged-in user)
 */
exports.getTradeById = async (req, res) => {
  try {
    const { id } = req.params;
    const trade = await Trade.findByPk(id);

    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }

    // Ensure the trade belongs to the user OR the user is an admin
    if (trade.user_id !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(trade);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a trade by ID (Only for the logged-in user)
 */
exports.deleteTrade = async (req, res) => {
  try {
    const { id } = req.params;
    const trade = await Trade.findByPk(id);

    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }

    // Ensure the trade belongs to the user OR the user is an admin
    if (trade.user_id !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    await trade.destroy();
    res.status(200).json({ message: "Trade deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Process a SELL trade using FIFO or LIFO for the logged-in user
 */
async function processSellTrade(stock_name, sell_quantity, trade_id, method, user_id, transaction) {
  try {
    let remainingQuantity = sell_quantity;

    // Get lots belonging to the user sorted based on FIFO or LIFO
    const lots = await Lot.findAll({
      where: {
        stock_name,
        user_id,
        lot_status: { [Op.ne]: "FULLY REALIZED" },
      },
      order: method === "FIFO" ? [["createdAt", "ASC"]] : [["createdAt", "DESC"]],
      transaction, // Ensure read happens within the transaction
      lock: true, // Prevent race conditions by locking the rows
    });

    for (let lot of lots) {
      if (remainingQuantity === 0) break;

      let availableQuantity = lot.lot_quantity - lot.realized_quantity;

      if (availableQuantity >= remainingQuantity) {
        // Fully utilize this lot
        await lot.update(
          {
            realized_quantity: lot.realized_quantity + remainingQuantity,
            realized_trade_id: trade_id,
            lot_status:
              lot.realized_quantity + remainingQuantity === lot.lot_quantity
                ? "FULLY REALIZED"
                : "PARTIALLY REALIZED",
          },
          { transaction } // Ensure update is within transaction
        );
        remainingQuantity = 0;
      } else {
        // Use up the entire lot
        await lot.update(
          {
            realized_quantity: lot.lot_quantity,
            realized_trade_id: trade_id,
            lot_status: "FULLY REALIZED",
          },
          { transaction } // Ensure update is within transaction
        );
        remainingQuantity -= availableQuantity;
      }
    }

    if (remainingQuantity > 0) {
      return false; // ❌ Indicate failure (not enough stocks)
    }

    return true; // ✅ Indicate success
  } catch (error) {
    throw error; // Ensure error is handled at a higher level
  }
}
