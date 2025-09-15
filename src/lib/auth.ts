"use client";
import { useEffect, useState } from "react";
import { meRequest, AuthUser } from "./api";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setLoading(false);
      return;
    }
    meRequest(token)
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  function signOut() {
    localStorage.removeItem("auth_token");
    setUser(null);
  }

  return { user, loading, signOut };
}









