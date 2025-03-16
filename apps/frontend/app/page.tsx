"use client";
import { AuthContext } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { useContext } from "react";

export default function Home() {
  const { user, token } = useContext(AuthContext) || {};

  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-gray-100 text-gray-800">
      <main className="flex flex-col items-center text-center p-6">
        <Image src="/next.svg" alt="Stock Trading Logo" width={180} height={38} />
        <h1 className="text-3xl font-bold mt-4">Welcome to Your Trading Platform</h1>
        <p className="text-lg mt-2">Buy & sell stocks seamlessly with real-time tracking.</p>

        <div className="flex gap-4 mt-6">
          {token ? (
            <Link href="/dashboard">
              <button className="px-5 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Go to Dashboard
              </button>
            </Link>
          ) : (
            <>
              <Link href="/auth/login">
                <button className="px-5 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Login
                </button>
              </Link>
              <Link href="/auth/register">
                <button className="px-5 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
