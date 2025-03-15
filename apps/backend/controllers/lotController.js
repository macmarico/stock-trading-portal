const Lot = require("../models/Lot");
/**
 * Get all lots for the logged-in user (Admins see all lots)
 */
exports.getLots = async (req, res) => {
  try {
    let lots;

    if (req.user.role === "admin") {
      lots = await Lot.findAll({
        order: [["createdAt", "DESC"]],
      }); // Admins see all lots
    } else {
      lots = await Lot.findAll({
        where: { user_id: req.user.userId },
        order: [["createdAt", "DESC"]],
      });
    }

    res.status(200).json(lots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
