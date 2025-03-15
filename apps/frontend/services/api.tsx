import axios from "axios";

const API_BASE_URL = process.env.API_URL
  ? process.env.API_URL
  : "http://localhost:5000/api"; // Update if needed

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ✅ Automatically attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle 401 (Unauthorized) - Redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized - Redirecting to login");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

// ✅ Fetch All Trades (No need to pass token manually)
export const fetchTrades = async () => {
  try {
    const res = await api.get("/trades");
    return res.data;
  } catch (error) {
    console.error("Error fetching trades:", error);
    return [];
  }
};

// ✅ Create Trade (Buy/Sell)
export const createTrade = async (tradeData: any, queryParam: string = "") => {
  try {
    const res = await api.post(`/trades${queryParam}`, tradeData);
    return res.data;
  } catch (error: any) {
    console.error(
      "Error creating trade:",
      error.response?.data?.message || error.message
    );
    throw new Error(error.response?.data?.message || "Trade creation failed");
  }
};

// ✅ Fetch Lots
export const fetchLots = async () => {
  try {
    const res = await api.get("/lots");
    return res.data;
  } catch (error) {
    console.error("Error fetching lots:", error);
    return [];
  }
};

// ✅ User Login
export const loginUser = async (email: string, password: string) => {
  try {
    const res = await api.post("/auth/login", { email, password });
    return res.data; // Returns { token, user }
  } catch (error: any) {
    console.error(
      "Login failed:",
      error.response?.data?.message || error.message
    );
    throw new Error(error.response?.data?.message || "Login failed");
  }
};

// ✅ User Register
export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  try {
    const res = await api.post("/auth/signup", { name, email, password });
    return res.data; // Returns { token, user }
  } catch (error: any) {
    console.error(
      "Registration failed:",
      error.response?.data?.message || error.message
    );
    throw new Error(error.response?.data?.message || "Registration failed");
  }
};

// ✅ Bulk Trade Upload (New Function)
export const uploadBulkTrades = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/trades/upload-trades", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data; // { message: "Trades uploaded successfully", count: 5 }
  } catch (error: any) {
    console.error(
      "Bulk upload failed:",
      error.response?.data?.message || error.message
    );
    throw new Error(error.response?.data?.message || "Bulk upload failed");
  }
};

export default api;
