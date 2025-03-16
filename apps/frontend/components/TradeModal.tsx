"use client";
import { useState } from "react";
import { createTrade } from "@/services/api";

const TradeModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState({
    stock_name: "",
    quantity: "",
    price: "",
    broker_name: "",
    trade_type: "BUY",
    method: "FIFO", // Default FIFO for SELL trades
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { stock_name, quantity, price, broker_name, trade_type, method } =
      formData;

    if (!stock_name || !quantity || !price || !broker_name) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    try {
      // Prepare query param for SELL trades
      const queryParam = trade_type === "SELL" ? `?method=${method}` : "";
      await createTrade(formData, queryParam);
      onClose(); // Close modal after successful trade
    } catch (err: any) {
      setError(err.message || "Failed to create trade");
    } finally {
      setFormData({
        stock_name: "",
        quantity: "",
        price: "",
        broker_name: "",
        trade_type: "BUY",
        method: "FIFO", // Default FIFO for SELL trades
      });
      setLoading(false);
    }
  };

  if (!isOpen) return null; // Don't render if modal is closed

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold text-center mb-4">Create Trade</h2>

        {error && <p className="text-red-500 text-center mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Stock Name</label>
            <input
              type="text"
              name="stock_name"
              value={formData.stock_name}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Broker Name</label>
            <input
              type="text"
              name="broker_name"
              value={formData.broker_name}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Trade Type</label>
            <select
              name="trade_type"
              value={formData.trade_type}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>

          {/* ✅ FIFO/LIFO Selection (Only for SELL Trades) */}
          {formData.trade_type === "SELL" && (
            <div>
              <label className="block text-sm font-medium">Sell Method</label>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              >
                <option value="FIFO">FIFO (First In, First Out)</option>
                <option value="LIFO">LIFO (Last In, First Out)</option>
              </select>
            </div>
          )}

          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  stock_name: "",
                  quantity: "",
                  price: "",
                  broker_name: "",
                  trade_type: "BUY",
                  method: "FIFO", // Default FIFO for SELL trades
                });
                onClose();
              }}
              className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Trade"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeModal;
