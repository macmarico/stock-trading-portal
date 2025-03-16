"use client";
import { useState } from "react";
import { uploadBulkTrades } from "@/services/api";

const BulkTradeUpload = ({ onUploadSuccess }: { onUploadSuccess: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ✅ Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setMessage("");
      setError("");
    }
  };

  // ✅ Handle bulk upload
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file");
      return;
    }

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const data = await uploadBulkTrades(file);
      setMessage(`✅ Trades uploaded successfully: ${data.count} trades`);
      setFile(null);
      onUploadSuccess(); // ✅ Refresh trades list
    } catch (err: any) {
      setError(`❌ Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-white shadow">
      <h2 className="text-lg font-semibold mb-2">Bulk Trade Upload (supports FIFO only)</h2>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="mb-2 border rounded p-2 w-full"
        disabled={uploading}
      />

      <button
        onClick={handleUpload}
        className={`px-4 py-2 rounded text-white ${
          uploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload CSV"}
      </button>
    </div>
  );
};

export default BulkTradeUpload;
