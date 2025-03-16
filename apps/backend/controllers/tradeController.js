const Trade = require("../models/Trade");
const Lot = require("../models/Lot");
const { Op } = require("sequelize");
const { sequelize } = require("../config/db");
const fs = require("fs");
const csv = require("csv-parser");
const { processSellTrade } = require("../services/tradeService");

/**
 * Create a new trade (BUY or SELL) for the logged-in user
 */
exports.createTrade = async (req, res) => {
  const transaction = await sequelize.transaction(); 

  try {
    let { stock_name, quantity, broker_name, price, trade_type } = req.body;
    const user_id = req.user.userId; 
    quantity = Number(quantity);
    price = Number(price);

    if (!stock_name || !quantity || !broker_name || !price || !trade_type) {
      await transaction.rollback();
      return res.status(400).json({ message: "All fields are required" });
    }

    if (quantity <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Quantity must be a positive number. If you want to sell your stocks please choose trade type as sell." });
    }

    if (price <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Price must be a positive number" });
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
      { transaction } 
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

      await transaction.commit();
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

      const success = await processSellTrade(
        stock_name,
        quantity,
        trade.trade_id,
        method,
        user_id,
        transaction
      );

      if (success) {
        await transaction.commit(); 
        return res.status(201).json({
          message: `Sell trade processed successfully using ${method}`,
          trade,
        });
      } else {
        await transaction.rollback(); 
        return res
          .status(400)
          .json({ message: "Not enough stocks available to sell" });
      }
    }
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Create a bulk new trade (BUY or SELL) for the logged-in user
 */
exports.uploadTrades = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.file) {
      await transaction.rollback();
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const trades = [];
    const user_id = req.user.userId;

    const stream = fs.createReadStream(filePath).pipe(csv());

    for await (const row of stream) {
      const { stock_name, quantity, price, broker_name, trade_type } = row;

      const parsedQuantity = Number(quantity);
      const parsedPrice = Number(price);

      if (
        !stock_name ||
        !broker_name ||
        isNaN(parsedQuantity) ||
        isNaN(parsedPrice) ||
        parsedQuantity <= 0 ||
        parsedPrice <= 0 ||
        !["BUY", "SELL"].includes(trade_type.toUpperCase())
      ) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: `Invalid data: ${JSON.stringify(row)}` });
      }

      trades.push({
        stock_name,
        quantity: parsedQuantity,
        price: parsedPrice,
        broker_name,
        trade_type: trade_type.toUpperCase(),
        user_id,
      });
    }

    // -----------------------------------------------------------------------
    // 1) CREATE TRADES IN SEQUENCE
    // -----------------------------------------------------------------------
    const createdTrades = [];
    for (const tradeEntry of trades) {
      // Insert each trade in sequence
      const createdTrade = await Trade.create(tradeEntry, { transaction });
      createdTrades.push(createdTrade);
    }

    // -----------------------------------------------------------------------
    // 2) CREATE LOTS FOR BUY TRADES (ALSO IN SEQUENCE IF NEEDED)
    // -----------------------------------------------------------------------
    const buyTrades = createdTrades.filter((t) => t.trade_type === "BUY");

    // Construct an array of Lot objects
    const lotsData = buyTrades.map((trade) => ({
      trade_id: trade.trade_id,
      stock_name: trade.stock_name,
      lot_quantity: trade.quantity,
      realized_quantity: 0,
      lot_status: "OPEN",
      user_id: trade.user_id,
    }));

    // Insert each Lot in sequence
    for (const lotEntry of lotsData) {
      await Lot.create(lotEntry, { transaction });
    }

    // -----------------------------------------------------------------------
    // 3) HANDLE SELL TRADES (FIFO LOGIC)
    // -----------------------------------------------------------------------
    const sellTrades = createdTrades.filter((t) => t.trade_type === "SELL");

    for (const trade of sellTrades) {
      const { stock_name, quantity, trade_id } = trade;
      let remainingQuantity = quantity;

      // Get existing open lots using FIFO
      const lotsToUpdate = await Lot.findAll({
        where: {
          stock_name,
          user_id,
          lot_status: { [Op.ne]: "FULLY REALIZED" },
        },
        order: [
          ["createdAt", "ASC"],
          ["lot_id", "ASC"],
        ], // FIFO Order
        transaction,
        lock: true,
      });

      for (const lot of lotsToUpdate) {
        if (remainingQuantity === 0) break;

        const availableQuantity = lot.lot_quantity - lot.realized_quantity;

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
            { transaction }
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
            { transaction }
          );
          remainingQuantity -= availableQuantity;
        }
      }

      if (remainingQuantity > 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Not enough stocks available to sell for ${stock_name}`,
        });
      }
    }

    // Commit if everything is successful
    await transaction.commit();

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    return res
      .status(201)
      .json({ message: "Trades uploaded successfully", count: trades.length });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
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