import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import LoadingSpinner from "../common/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import { forgotPasswordSchema, resetPasswordSchema, ForgotPasswordFormData, ResetPasswordFormData } from "../../schemas/auth";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { sendPasswordResetCode, resetPassword } = useAuth();
  const navigate = useNavigate();

  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors, isSubmitting: isSending },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: isResetting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const requestCode = async (data: ForgotPasswordFormData) => {
    setError("");
    setSuccess("");
    try {
      await sendPasswordResetCode(data.email);
      setEmail(data.email);
      setCodeSent(true);
      setSuccess("If the email exists, a reset code was sent.");
    } catch (error: any) {
      setError(error.message || "Could not send reset code.");
    }
  };

  const submitNewPassword = async (data: ResetPasswordFormData) => {
    setError("");
    setSuccess("");
    try {
      await resetPassword(email, data.code, data.newPassword);
      setSuccess("Password updated. Redirecting to sign in...");
      setTimeout(() => navigate("/signin", { replace: true }), 1000);
    } catch (error: any) {
      setError(error.message || "Could not reset password.");
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full lg:w-1/2">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg
            className="stroke-current"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M12.7083 5L7.5 10.2083L12.7083 15.4167"
              stroke=""
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Forgot Your Password?
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter the email address linked to your account, then use the reset code to create a new password.
          </p>
        </div>
        <div>
          {!codeSent ? (
          <form onSubmit={handleForgotSubmit(requestCode)} noValidate>
            <div className="space-y-5">
              <div>
                <Label>
                  Email<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  {...registerForgot("email")}
                />
                {forgotErrors.email && (
                  <p className="mt-1 text-sm text-error-500">{forgotErrors.email.message}</p>
                )}
              </div>

              {error && (
                <div className="p-3 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-green-800 bg-green-100 rounded-lg dark:bg-green-900/30 dark:text-green-400">
                  {success}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Sending code...
                    </>
                  ) : (
                    "Send Reset Code"
                  )}
                </button>
              </div>
            </div>
          </form>
          ) : (
          <form onSubmit={handleResetSubmit(submitNewPassword)} noValidate>
            <div className="space-y-5">
              <div>
                <Label>
                  Code<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="code"
                  placeholder="Enter the reset code"
                  {...registerReset("code")}
                />
                {resetErrors.code && (
                  <p className="mt-1 text-sm text-error-500">{resetErrors.code.message}</p>
                )}
              </div>

              <div>
                <Label>
                  New Password<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="password"
                  id="newPassword"
                  placeholder="Create your new password"
                  {...registerReset("newPassword")}
                />
                {resetErrors.newPassword && (
                  <p className="mt-1 text-sm text-error-500">{resetErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <Label>
                  Confirm Password<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  placeholder="Confirm your new password"
                  {...registerReset("confirmPassword")}
                />
                {resetErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-error-500">{resetErrors.confirmPassword.message}</p>
                )}
              </div>

              {error && (
                <div className="p-3 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-green-800 bg-green-100 rounded-lg dark:bg-green-900/30 dark:text-green-400">
                  {success}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCodeSent(false);
                    setSuccess("");
                    setError("");
                  }}
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-700 transition rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Change email
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </div>
          </form>
          )}
          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Wait, I remember my password...
              <Link
                to="/signin"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Click here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
