"use client";
import { useEffect, useState, useContext } from "react";
import { fetchLots } from "@/services/api";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

const LotsPage = () => {
  const auth = useContext(AuthContext);
  const router = useRouter();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (!auth?.token) {
      router.push("/auth/login");
      return;
    }

    const loadLots = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchLots();
        setLots(data);
      } catch (err: any) {
        setError("Failed to load lots.");
      } finally {
        setLoading(false);
      }
    };

    loadLots();
  }, [auth?.token, router]);

  const filteredLots =
    filter === "ALL"
      ? lots
      : lots.filter((lot: any) => lot.lot_status === filter);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* ✅ Navigation Buttons */}
      <div className="flex justify-between mb-4">
        <Link href="/dashboard">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            ← Back to Dashboard
          </button>
        </Link>
        <h1 className="text-2xl font-bold">Lots Management</h1>
      </div>

      {/* ✅ Filter Buttons */}
      <div className="mb-4 flex gap-3">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 rounded ${filter === "ALL" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("FIFO")}
          className={`px-4 py-2 rounded ${filter === "FIFO" ? "bg-green-600 text-white" : "bg-gray-300"}`}
        >
          FIFO
        </button>
        <button
          onClick={() => setFilter("LIFO")}
          className={`px-4 py-2 rounded ${filter === "LIFO" ? "bg-red-600 text-white" : "bg-gray-300"}`}
        >
          LIFO
        </button>
      </div>

      {/* ✅ Lots Table */}
      <div className="bg-white shadow-md rounded-md p-4">
        {loading ? (
          <p className="text-gray-500">Loading lots...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : filteredLots.length === 0 ? (
          <p className="text-gray-500">No lots found</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Stock</th>
                <th className="border p-2">Lot Quantity</th>
                <th className="border p-2">Realized Quantity</th>
                <th className="border p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLots.map((lot: any) => (
                <tr key={lot.lot_id} className="text-center border-t">
                  <td className="border p-2">{lot.stock_name}</td>
                  <td className="border p-2">{lot.lot_quantity}</td>
                  <td className="border p-2">{lot.realized_quantity}</td>
                  <td className="border p-2">{lot.lot_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LotsPage;
