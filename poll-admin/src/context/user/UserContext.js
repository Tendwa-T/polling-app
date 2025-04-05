"use client";

import { createContext, useState } from "react";

export const UserContext = createContext();
const baseAPI = process.env.NEXT_PUBLIC_BASE_API;

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function userLogin(email, password) {
    try {
      const response = await fetch(`${baseAPI}/api/v1/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.data));
        localStorage.setItem("token", data.token);
        setUser(data.data);
        setError(null);
        return {
          success: true,
          message: "Login Successful",
        };
      } else {
        setError(data.message);
        return {
          success: false,
          message: data.message,
        };
      }
    } catch (error) {
      setError(error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  const value = {
    user,
    loading,
    error,
    userLogin,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
