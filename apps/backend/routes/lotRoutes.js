const express = require('express');
const { getLots, handleTrade } = require('../controllers/lotController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

/**
 * @swagger
 * /api/lots:
 *   get:
 *     summary: Retrieve all lots for the logged-in user
 *     tags: [Lots]
 *     security:
 *       - bearerAuth: []
 *     description: Get a list of all stock lots belonging to the logged-in user. Admins can retrieve all lots.
 *     responses:
 *       200:
 *         description: List of lots retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               - lot_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 trade_id: "abc12345"
 *                 stock_name: "Apple"
 *                 lot_quantity: 100
 *                 realized_quantity: 50
 *                 lot_status: "PARTIALLY REALIZED"
 *                 user_id: "e628172a-2cb3-44de-ae45-8fea3625a426"
 *               - lot_id: "223e4567-e89b-12d3-a456-426614174001"
 *                 trade_id: "xyz67890"
 *                 stock_name: "Tesla"
 *                 lot_quantity: 200
 *                 realized_quantity: 0
 *                 lot_status: "OPEN"
 *                 user_id: "e628172a-2cb3-44de-ae45-8fea3625a426"
 *       401:
 *         description: Unauthorized - JWT token required
 *         content:
 *           application/json:
 *             example:
 *               message: "Unauthorized - JWT token required"
 */
router.get('/', authMiddleware, getLots);

module.exports = router;