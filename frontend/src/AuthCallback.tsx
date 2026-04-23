import { useEffect, useState } from "react";
import { supabase } from "./services/supabaseClient";

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (data.session) {
          console.log("Authentication successful for user:", data.session.user.email);

          setTimeout(() => {
            window.location.replace("/");
          }, 1000);
        } else {
          setError("Authentication completed but session not found");
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err instanceof Error ? err.message : "Unknown authentication error");

        setTimeout(() => {
          window.location.replace("/?auth=signin");
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    void handleAuthCallback();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <p className="mt-4 text-white text-lg">Processing your authentication...</p>
          <p className="text-secondary text-sm mt-2">You'll be redirected shortly</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">!</div>
          <h1 className="text-white text-2xl font-bold mb-2">Authentication Error</h1>
          <p className="text-red-400 mb-4">{error}</p>
          <p className="text-secondary text-sm">Redirecting you back to sign-in...</p>
        </div>
      </div>
    );
  }

  return null;
}
