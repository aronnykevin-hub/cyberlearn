"use client";
import { useState } from "react";
import { toast } from "sonner";
import authService from "./services/authService";

interface LinkEmailFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LinkEmailForm({ onSuccess, onCancel }: LinkEmailFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Link Email to Account</h3>
      <p className="text-sm text-secondary mb-6">
        Save your progress by linking an email. You'll be able to sign in with this email next time.
      </p>
      
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          const email = String(formData.get("email") ?? "").trim();
          const password = String(formData.get("password") ?? "");

          if (!email || email.length < 5) {
            toast.error("Please enter a valid email address.");
            setSubmitting(false);
            return;
          }

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

          authService
            .linkEmail(email, password)
            .then(() => {
              toast.success("Email linked successfully! Your progress is now saved.");
              onSuccess?.();
            })
            .catch((error: Error) => {
              let toastTitle = "Failed to link email. Please try again.";
              
              if (error.message.includes("already in use")) {
                toastTitle = "This email is already registered. Use a different email.";
              } else if (error.message.includes("Password")) {
                toastTitle = "Password is too weak. Use at least 8 characters.";
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
          placeholder="Email address"
          autoComplete="email"
          required
        />
        
        <div className="relative">
          <input
            className="auth-input-field pr-10"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Create password"
            autoComplete="new-password"
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

        <p className="text-xs text-secondary">
          Use at least 8 characters for your password.
        </p>

        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? "Linking email..." : "Link Email"}
        </button>

        {onCancel && (
          <button
            type="button"
            className="auth-button-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Continue as guest
          </button>
        )}
      </form>
    </div>
  );
}
