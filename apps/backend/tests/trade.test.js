const { processSellTrade } = require("../services/tradeService");
const Lot = require("../models/Lot"); // Mock this
const { Op } = require("sequelize");

// Mock Sequelize methods
jest.mock("../models/Lot", () => ({
  findAll: jest.fn(),
  update: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks(); // Reset mocks before each test
});

describe("processSellTrade Function (Mocked DB)", () => {
  const user_id = 1;
  const stock_name = "AAPL";

  test("Should successfully process a SELL trade using FIFO", async () => {
    // Mock existing stock lots (FIFO Order)
    const mockLots = [
      {
        lot_id: 1,
        lot_quantity: 10,
        realized_quantity: 0,
        lot_status: "OPEN",
        createdAt: new Date("2024-01-01"),
        update: jest.fn(), // Mock instance method
      },
      {
        lot_id: 2,
        lot_quantity: 15,
        realized_quantity: 0,
        lot_status: "OPEN",
        createdAt: new Date("2024-01-02"),
        update: jest.fn(), // Mock instance method
      },
    ];

    Lot.findAll.mockResolvedValue(mockLots); // Mock DB response

    const transaction = { commit: jest.fn(), rollback: jest.fn() }; // Mock transaction

    const result = await processSellTrade(stock_name, 12, 3, "FIFO", user_id, transaction);

    expect(result).toBe(true);
    expect(Lot.findAll).toHaveBeenCalledTimes(1);

    // Check if `update` was called on the correct instances
    expect(mockLots[0].update).toHaveBeenCalledWith(
      {
        realized_quantity: 10,
        realized_trade_id: 3,
        lot_status: "FULLY REALIZED",
      },
      { transaction }
    );

    expect(mockLots[1].update).toHaveBeenCalledWith(
      {
        realized_quantity: 2,
        realized_trade_id: 3,
        lot_status: "PARTIALLY REALIZED",
      },
      { transaction }
    );
  });

  test("Should successfully process a SELL trade using LIFO", async () => {
    // Mock existing stock lots (LIFO Order)
    const mockLots = [
      {
        lot_id: 2,
        lot_quantity: 15,
        realized_quantity: 0,
        lot_status: "OPEN",
        createdAt: new Date("2024-01-02"), // Newer lot (LIFO → Sold first)
        update: jest.fn(), // Mock instance method
      },
      {
        lot_id: 1,
        lot_quantity: 10,
        realized_quantity: 0,
        lot_status: "OPEN",
        createdAt: new Date("2024-01-01"), // Older lot
        update: jest.fn(), // Mock instance method
      },
    ];
  
    Lot.findAll.mockResolvedValue(mockLots); // Mock DB response
  
    const transaction = { commit: jest.fn(), rollback: jest.fn() }; // Mock transaction
  
    const result = await processSellTrade(stock_name, 12, 3, "LIFO", user_id, transaction);
  
    expect(result).toBe(true);
    expect(Lot.findAll).toHaveBeenCalledTimes(1);
  
    expect(mockLots[0].update).toHaveBeenCalledWith(
      {
        realized_quantity: 12,
        realized_trade_id: 3,
        lot_status: "PARTIALLY REALIZED",
      },
      { transaction }
    );
  
    expect(mockLots[1].update).not.toHaveBeenCalled();
  });

  test("Should fail when no stocks are available", async () => {
    Lot.findAll.mockResolvedValue([]); 

    const transaction = { commit: jest.fn(), rollback: jest.fn() };

    const result = await processSellTrade(stock_name, 5, 3, "FIFO", user_id, transaction);

    expect(result).toBe(false);
    expect(Lot.findAll).toHaveBeenCalledTimes(1);
    expect(Lot.update).not.toHaveBeenCalled(); 
  });
});
