"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchTrades } from "../../services/api";
import { AuthContext } from "@/context/AuthContext";
import TradeModal from "@/components/TradeModal";
import Link from "next/link";

const Dashboard = () => {
  const auth = useContext(AuthContext);
  const router = useRouter();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // ✅ Modal state

  useEffect(() => {
    if (auth?.loading) return;
    if (!auth?.token) {
      router.push("/auth/login");
      return;
    }

    const loadTrades = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchTrades(auth.token);
        setTrades(data);
      } catch (err: any) {
        setError("Failed to load trades. Please try again.");
        console.error("Error fetching trades:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTrades();
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
        <Link href="/lots">
          <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            View Lots
          </button>
        </Link>

        {/* ✅ Trade Modal */}
        <TradeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />

        <h3 className="text-xl font-semibold mt-6 mb-2">Your Trades</h3>
        <div className="bg-white shadow rounded-md p-4">
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
                </tr>
              </thead>
              <tbody>
                {trades.map((trade: any) => (
                  <tr key={trade.trade_id} className="text-center border-t">
                    <td className="border p-2">{trade.stock_name}</td>
                    <td className="border p-2">{trade.quantity}</td>
                    <td className="border p-2">${trade.price}</td>
                    <td className="border p-2">{trade.trade_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
