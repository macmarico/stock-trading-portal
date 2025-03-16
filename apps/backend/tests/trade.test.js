
const { processSellTrade } = require("../controllers/tradeController");
const Lot = require("../models/Lot");
jest.mock("../models/Lot", () => {
  return {
    findAll: jest.fn().mockResolvedValue([]), // ✅ Mocking as a function directly
    update: jest.fn().mockResolvedValue([]),
  };
});



describe("FIFO & LIFO Logic for Sell Trades", () => {
  let user_id = 1;
  let stock_name = "AAPL";
  let trade_id = 101;
  transaction = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("FIFO: Sell trade reduces stocks from oldest lot first", async () => {
    Lot.findAll.mockResolvedValue([
      { lot_quantity: 10, realized_quantity: 0, update: jest.fn() },
      { lot_quantity: 15, realized_quantity: 0, update: jest.fn() },
    ]);

    const success = await processSellTrade(stock_name, 12, trade_id, "FIFO", user_id);

    expect(success).toBe(true);
    expect(Lot.findAll).toHaveBeenCalledWith({
      where: { stock_name, user_id, lot_status: expect.any(Object) },
      order: [["createdAt", "ASC"]],
    });
  });

  test("LIFO: Sell trade reduces stocks from newest lot first", async () => {
    Lot.findAll.mockResolvedValue([
      { lot_quantity: 20, realized_quantity: 0, update: jest.fn() },
      { lot_quantity: 15, realized_quantity: 0, update: jest.fn() },
    ]);

    const success = await processSellTrade(stock_name, 18, trade_id, "LIFO", user_id);

    expect(success).toBe(true);
    expect(Lot.findAll).toHaveBeenCalledWith({
      where: { stock_name, user_id, lot_status: expect.any(Object) },
      order: [["createdAt", "DESC"]],
    });
  });

  test("Sell trade fails when insufficient stocks are available", async () => {
    Lot.findAll.mockResolvedValue([
      { lot_quantity: 10, realized_quantity: 0, update: jest.fn() },
    ]);

    const success = await processSellTrade(stock_name, 50, trade_id, "FIFO", user_id);

    expect(success).toBe(false);
  });
});
