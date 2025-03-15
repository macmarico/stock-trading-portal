const express = require("express");
const multer = require("multer");
const { createTrade, getTrades, getTradeById, deleteTrade, uploadTrades } = require("../controllers/tradeController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * @swagger
 * tags:
 *   name: Trades
 *   description: Stock trading APIs
 */

/**
 * @swagger
 * /api/trades:
 *   post:
 *     summary: Create a trade (BUY or SELL)
 *     tags: [Trades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: method
 *         required: false
 *         schema:
 *           type: string
 *           enum: [FIFO, LIFO]
 *         description: "Method for processing the sell trade (Required only for SELL trades)"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stock_name
 *               - quantity
 *               - broker_name
 *               - price
 *               - trade_type
 *             properties:
 *               stock_name:
 *                 type: string
 *                 example: "Apple"
 *               quantity:
 *                 type: integer
 *                 example: 100
 *               broker_name:
 *                 type: string
 *                 example: "Broker A"
 *               price:
 *                 type: number
 *                 example: 150.5
 *               trade_type:
 *                 type: string
 *                 enum: [BUY, SELL]
 *                 example: "SELL"
 *     responses:
 *       201:
 *         description: Trade executed successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Trade executed successfully using FIFO"
 *               trade:
 *                 trade_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 stock_name: "Apple"
 *                 quantity: 100
 *                 broker_name: "Broker A"
 *                 price: 150.5
 *                 trade_type: "SELL"
 *                 method: "FIFO"
 *                 user_id: "e628172a-2cb3-44de-ae45-8fea3625a426"
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             example:
 *               message: "Specify method as FIFO or LIFO"
 *       401:
 *         description: Unauthorized - JWT token required
 *         content:
 *           application/json:
 *             example:
 *               message: "Unauthorized - JWT token required"
 */

router.post("/", authMiddleware, createTrade);

/**
 * @swagger
 * /api/trades:
 *   get:
 *     summary: Fetch all trades for the logged-in user
 *     tags: [Trades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trades
 *       401:
 *         description: Unauthorized - JWT token required
 */
router.get("/", authMiddleware, getTrades);

/**
 * @swagger
 * /api/trades/{id}:
 *   get:
 *     summary: Fetch a specific trade by ID
 *     tags: [Trades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trade ID
 *     responses:
 *       200:
 *         description: Trade details
 *       404:
 *         description: Trade not found
 *       401:
 *         description: Unauthorized - JWT token required
 */
router.get("/:id", authMiddleware, getTradeById);

/**
 * @swagger
 * /api/trades/{id}:
 *   delete:
 *     summary: Cancel/Delete a trade by ID
 *     tags: [Trades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trade ID
 *     responses:
 *       200:
 *         description: Trade deleted successfully
 *       404:
 *         description: Trade not found
 *       401:
 *         description: Unauthorized - JWT token required
 */
router.delete("/:id", authMiddleware, deleteTrade);

/**
 * @swagger
 * /api/trades/upload-trades:
 *   post:
 *     summary: Bulk upload trades via CSV file
 *     description: Upload a CSV file containing multiple trades (BUY/SELL) for batch processing.
 *     tags:
 *       - Trades
 *     security:
 *       - BearerAuth: []  # ✅ Explicitly add security
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The CSV file containing trade data.
 *     responses:
 *       201:
 *         description: Trades uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Trades uploaded successfully"
 *                 count:
 *                   type: integer
 *                   example: 5
 *       400:
 *         description: Invalid CSV file or missing fields.
 *       401:
 *         description: Unauthorized (Invalid or missing Bearer token)
 *       500:
 *         description: Internal server error.
 */
router.post("/upload-trades", authMiddleware, upload.single("file"), uploadTrades);

module.exports = router;
