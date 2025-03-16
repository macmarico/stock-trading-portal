const { Op } = require("sequelize");
const Lot = require("../models/Lot");

async function processSellTrade(
  stock_name,
  sell_quantity,
  trade_id,
  method,
  user_id,
  transaction
) {
  try {
    let remainingQuantity = sell_quantity;

    // Get lots belonging to the user sorted based on FIFO or LIFO
    const lots = await Lot.findAll({
      where: {
        stock_name,
        user_id,
        lot_status: { [Op.ne]: "FULLY REALIZED" },
      },
      order:
        method === "FIFO" ? [["createdAt", "ASC"]] : [["createdAt", "DESC"]],
      transaction,
      lock: true,
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

module.exports = { processSellTrade };
