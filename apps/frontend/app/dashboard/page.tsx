"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchTrades, fetchLots } from "../../services/api"; // ✅ Fetch Lots API
import { AuthContext } from "@/context/AuthContext";
import TradeModal from "@/components/TradeModal";
import Link from "next/link";
import BulkTradeUpload from "@/components/BulkTradeUpload";

const Dashboard = () => {
  const auth = useContext(AuthContext);
  const router = useRouter();
  const [trades, setTrades] = useState([]);
  const [lots, setLots] = useState<{ [key: string]: any[] }>({}); // ✅ State for lots with type definition
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // ✅ Modal state

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // ✅ Fetch Trades and Lots
      const [tradeData, lotData] = await Promise.all([
        fetchTrades(),
        fetchLots(),
      ]);

      setTrades(tradeData);

      const groupedLots: { [key: string]: any[] } = {};
      lotData.forEach((lot: any) => {
        if (!groupedLots[lot.stock_name]) {
          groupedLots[lot.stock_name] = [];
        }
        groupedLots[lot.stock_name].push(lot);
      });
      setLots(groupedLots);
    } catch (err: any) {
      setError("Failed to load data. Please try again.");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const onUploadSuccess = () => {
    loadData();
  };

  useEffect(() => {
    if (auth?.loading) return;
    if (!auth?.token) {
      router.push("/auth/login");
      return;
    }

    loadData();
  }, [auth?.token, auth?.loading, router, isModalOpen]);

  if (auth?.loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 p-4 text-white flex justify-between">
        <h1 className="text-lg font-bold">Stock Trading Dashboard</h1>
        <button onClick={auth?.logout} className="bg-red-500 px-3 py-1 rounded">
          Logout
        </button>
      </nav>

      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Welcome, {auth?.user?.name || "Trader"}
        </h2>

        {/* ✅ "Create Trade" Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Create Trade
        </button>

        {/* ✅ Bulk Upload Component */}
        <div className="my-4">
          <BulkTradeUpload onUploadSuccess={onUploadSuccess} />
        </div>

        {/* ✅ Trade Modal */}
        <TradeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />

        {/* ✅ Grid Layout (Lots on the Left, Trades on the Right) */}
        <div className="grid grid-cols-2 gap-6">
          {/* ✅ Left Column: Lots Table */}

          <div className="bg-white shadow rounded-md p-4">
            <h3 className="text-xl font-semibold mb-2">Your Trades</h3>
            {loading ? (
              <p className="text-gray-500">Loading trades...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : trades.length === 0 ? (
              <p className="text-gray-500">No trades found</p>
            ) : (
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Stock</th>
                    <th className="border p-2">Quantity</th>
                    <th className="border p-2">Price</th>
                    <th className="border p-2">Trade Type</th>
                    <th className="border p-2">Date & Time</th>{" "}
                    {/* ✅ New Column */}
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade: any) => (
                    <tr key={trade.trade_id} className="text-center border-t">
                      <td className="border p-2">{trade.stock_name}</td>
                      <td className="border p-2">{trade.quantity}</td>
                      <td className="border p-2">${trade.price}</td>
                      <td className="border p-2">{trade.trade_type}</td>
                      <td className="border p-2">
                        {new Date(trade.createdAt).toLocaleString()}
                      </td>{" "}
                      {/* ✅ Display Date & Time */}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* ✅ Right Column: Trades Table */}
          <div className="bg-white shadow rounded-md p-4">
            <h3 className="text-xl font-semibold mb-2">
              Your Lots (Grouped by Stock)
            </h3>
            {loading ? (
              <p className="text-gray-500">Loading lots...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : Object.keys(lots).length === 0 ? (
              <p className="text-gray-500">No lots found</p>
            ) : (
              <div>
                {Object.keys(lots).map((stockName) => (
                  <div key={stockName} className="mb-4">
                    <h4 className="text-lg font-bold bg-gray-200 p-2 rounded">
                      {stockName}
                    </h4>
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2">Lot ID</th>{" "}
                          {/* ✅ Added Lot ID Column */}
                          <th className="border p-2">Lot Quantity</th>
                          <th className="border p-2">Realized Quantity</th>
                          <th className="border p-2">Status</th>
                          <th className="border p-2">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lots[stockName].map((lot: any) => (
                          <tr key={lot.lot_id} className="text-center border-t">
                            <td className="border p-2">{lot.lot_id}</td>{" "}
                            {/* ✅ Display Lot ID */}
                            <td className="border p-2">{lot.lot_quantity}</td>
                            <td className="border p-2">
                              {lot.realized_quantity}
                            </td>
                            <td className="border p-2">{lot.lot_status}</td>
                            <td className="border p-2">
                              {new Date(lot.createdAt).toLocaleString()}{" "}
                              {/* ✅ Display Date & Time */}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
