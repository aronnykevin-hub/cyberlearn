"use client";
import { useState } from "react";
import { toast } from "sonner";
import authService from "./services/authService";

export function SignInForm() {
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          const email = String(formData.get("email") ?? "").trim();
          const password = String(formData.get("password") ?? "");

          if (flow === "signUp") {
            if (password.length < 8) {
              toast.error("Password must be at least 8 characters.");
              setSubmitting(false);
              return;
            }

            if (password !== confirmPassword) {
              toast.error("Passwords do not match.");
              setSubmitting(false);
              return;
            }
          }

          const action =
            flow === "signIn"
              ? authService.signIn(email, password)
              : authService
                  .signUp(email, password)
                  .then(() => authService.signIn(email, password));

          void action
            .then(() => {
              toast.success(
                flow === "signIn"
                  ? "Signed in successfully"
                  : "Account created successfully",
              );
            })
            .catch((error: Error) => {
              let toastTitle = "Authentication failed. Please try again.";

              if (flow === "signUp" && error.message.includes("Email not confirmed")) {
                toastTitle =
                  "Email confirmation is still enabled in Supabase. Disable it in Authentication settings for instant signup.";
              }

              if (error.message.includes("Invalid login credentials")) {
                toastTitle = "Invalid email or password. Please try again.";
              } else if (
                error.message.includes("User already registered") ||
                error.message.includes("already registered")
              ) {
                toastTitle = "This email is already registered. Sign in instead.";
              } else if (error.message.includes("Password should be at least")) {
                toastTitle = "Password is too weak. Use at least 8 characters.";
              } else if (!error.message.includes("Email not confirmed")) {
                toastTitle =
                  flow === "signIn"
                    ? "Could not sign in, did you mean to sign up?"
                    : "Could not sign up, did you mean to sign in?";
              }

              toast.error(toastTitle);
            })
            .finally(() => {
              setSubmitting(false);
            });
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          autoComplete="email"
          required
        />
        <div className="relative">
          <input
            className="auth-input-field pr-10"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            autoComplete={flow === "signIn" ? "current-password" : "new-password"}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>
        {flow === "signUp" && (
          <>
            <div className="relative">
              <input
                className="auth-input-field pr-10"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm password"
                value={confirmPassword}
                autoComplete="new-password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <p className="text-xs text-secondary -mt-2">
              Use at least 8 characters for your password.
            </p>
          </>
        )}
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting
            ? flow === "signIn"
              ? "Signing in..."
              : "Creating account..."
            : flow === "signIn"
              ? "Sign in"
              : "Create account"}
        </button>
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => {
              setFlow(flow === "signIn" ? "signUp" : "signIn");
              setConfirmPassword("");
            }}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-gray-200" />
        <span className="mx-4 text-secondary">or</span>
        <hr className="my-4 grow border-gray-200" />
      </div>
      <button
        className="auth-button"
        type="button"
        onClick={() => toast.info("Anonymous sign-in is not enabled in Supabase")}
      >
        Continue as guest
      </button>
    </div>
  );
}
