"use client";
import { useEffect, useState } from "react";
import authService from "./services/authService";

export function SignOutButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    void authService.getCurrentUser().then((user) => {
      if (mounted) {
        setIsAuthenticated(Boolean(user));
      }
    });

    const unsubscribe = authService.onAuthStateChange((user) => {
      setIsAuthenticated(Boolean(user));
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      className="px-4 py-2 rounded bg-white text-secondary border border-gray-200 font-semibold hover:bg-gray-50 hover:text-secondary-hover transition-colors shadow-sm hover:shadow"
      onClick={() => void authService.signOut()}
    >
      Sign out
    </button>
  );
}
