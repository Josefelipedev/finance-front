import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useGoogleLogin } from "@react-oauth/google";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema } from "../../schemas/auth.ts";
import api from "../../services/api.ts";

interface SignInFormData {
    email: string;
    password: string;
    rememberMe: boolean;
}

interface WhatsAppLoginData {
    phone: string;
    code: string;
}

type LoginMethod = "email" | "whatsapp" | "google";

export default function SignInForm() {
    const [activeMethod, setActiveMethod] = useState<LoginMethod>("email");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();

    // Form para email/senha
    const {
        register: registerEmail,
        handleSubmit: handleSubmitEmail,
        formState: { errors: errorsEmail },
        reset: resetEmail,
    } = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false,
        },
    });

    // Form para WhatsApp
    const {
        register: registerWhatsApp,
        handleSubmit: handleSubmitWhatsApp,
        formState: { errors: errorsWhatsApp },
        getValues: getWhatsAppValues,
        setValue: setWhatsAppValue,
        reset: resetWhatsApp,
    } = useForm<WhatsAppLoginData>();

    // Countdown para reenvio de código
    useState(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    });

    // Função para enviar código de verificação via WhatsApp
    const sendWhatsAppCode = async () => {
        const phone = getWhatsAppValues("phone");
        if (!phone || phone.length < 10) {
            setError("Please enter a valid phone number");
            return;
        }

        setIsSendingCode(true);
        setError("");
        setSuccess("");

        try {
            const response = await api.post("/auth/send-code", { phone });

            if (response.data.success) {
                setVerificationSent(true);
                setCountdown(60); // 60 segundos para reenvio
                setSuccess("Verification code sent via WhatsApp");
                // Focar no campo de código
                setTimeout(() => {
                    const codeInput = document.getElementById("whatsappCode");
                    if (codeInput) {
                        codeInput.focus();
                    }
                }, 100);
            }
        } catch (error: any) {
            console.error("Erro ao enviar código:", error);
            setError(error.response?.data?.message || "Failed to send verification code");
        } finally {
            setIsSendingCode(false);
        }
    };

    // Função para verificar código do WhatsApp
    const verifyWhatsAppCode = async (data: WhatsAppLoginData) => {
        setIsVerifyingCode(true);
        setError("");
        setSuccess("");

        try {
            const response = await api.post("/auth/verify-code", {
                phone: data.phone,
                code: data.code,
            });

            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));
                setSuccess("Login successful! Redirecting...");
                setTimeout(() => navigate("/dashboard"), 1000);
            }
        } catch (error: any) {
            console.error("Erro ao verificar código:", error);
            setError(error.response?.data?.message || "Invalid verification code");
        } finally {
            setIsVerifyingCode(false);
        }
    };

    // Função para login com email e senha
    const onSubmitEmail = async (data: SignInFormData) => {
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await api.post("/auth/login", {
                email: data.email,
                password: data.password,
            });

            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));

                if (data.rememberMe) {
                    localStorage.setItem("rememberMe", "true");
                }

                setSuccess("Login successful! Redirecting...");
                setTimeout(() => navigate("/dashboard"), 1000);
            }
        } catch (error: any) {
            console.error("Erro no login:", error);
            setError(error.response?.data?.message || "Invalid credentials");
        } finally {
            setIsLoading(false);
        }
    };

    // Função para login com Google
    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            setError("");
            setSuccess("");

            try {
                const userInfo = await fetch(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    {
                        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                    }
                ).then((res) => res.json());

                const response = await api.post("/auth/google", {
                    token: tokenResponse.access_token,
                    userInfo: userInfo,
                });

                if (response.data.token) {
                    localStorage.setItem("token", response.data.token);
                    localStorage.setItem("user", JSON.stringify(response.data.user));
                    setSuccess("Login successful! Redirecting...");
                    setTimeout(() => navigate("/dashboard"), 1000);
                }
            } catch (error) {
                console.error("Erro ao fazer login com Google:", error);
                setError("Failed to login with Google");
            } finally {
                setIsLoading(false);
            }
        },
        onError: (error) => {
            console.error("Login Failed:", error);
            setError("Failed to connect with Google");
            setIsLoading(false);
        },
        scope: "email profile",
    });

    // Função para reenviar código
    const resendWhatsAppCode = async () => {
        if (countdown > 0) return;
        await sendWhatsAppCode();
    };

    return (
        <div className="flex flex-col flex-1">
            <div className="w-full max-w-md pt-10 mx-auto">
                <Link
                    to="/"
                    className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                    <ChevronLeftIcon className="size-5" />
                    Back to dashboard
                </Link>
            </div>
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div>
                    <div className="mb-5 sm:mb-8">
                        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                            Sign In
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Choose your preferred login method
                        </p>
                    </div>

                    {/* Tabs para escolher o método de login */}
                    <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
                        <button
                            className={`flex-1 py-3 text-sm font-medium ${
                                activeMethod === "email"
                                    ? "text-brand-500 border-b-2 border-brand-500"
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            }`}
                            onClick={() => {
                                setActiveMethod("email");
                                setError("");
                                setSuccess("");
                            }}
                        >
                            Email & Password
                        </button>
                        <button
                            className={`flex-1 py-3 text-sm font-medium ${
                                activeMethod === "whatsapp"
                                    ? "text-brand-500 border-b-2 border-brand-500"
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            }`}
                            onClick={() => {
                                setActiveMethod("whatsapp");
                                setError("");
                                setSuccess("");
                            }}
                        >
                            WhatsApp
                        </button>
                        <button
                            className={`flex-1 py-3 text-sm font-medium ${
                                activeMethod === "google"
                                    ? "text-brand-500 border-b-2 border-brand-500"
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            }`}
                            onClick={() => {
                                setActiveMethod("google");
                                setError("");
                                setSuccess("");
                            }}
                        >
                            Google
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 mb-4 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 mb-4 text-sm text-green-800 bg-green-100 rounded-lg dark:bg-green-900/30 dark:text-green-400">
                            {success}
                        </div>
                    )}

                    {/* Login por Email e Senha */}
                    {activeMethod === "email" && (
                        <form onSubmit={handleSubmitEmail(onSubmitEmail)}>
                            <div className="space-y-6">
                                <div>
                                    <Label>
                                        Email <span className="text-error-500">*</span>
                                    </Label>
                                    <Input
                                        placeholder="info@gmail.com"
                                        {...registerEmail("email")}
                                        error={!!errorsEmail.email}
                                    />
                                    {errorsEmail.email && (
                                        <p className="mt-1 text-sm text-error-500">
                                            {errorsEmail.email.message}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label>
                                        Password <span className="text-error-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            {...registerEmail("password")}
                                            error={!!errorsEmail.password}
                                        />
                                        <span
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                        >
                      {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                                    </div>
                                    {errorsEmail.password && (
                                        <p className="mt-1 text-sm text-error-500">
                                            {errorsEmail.password.message}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="rememberMe"
                                            {...registerEmail("rememberMe")}
                                        />
                                        <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                                    </div>
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div>
                                    <Button className="w-full" size="sm" disabled={isLoading}>
                                        {isLoading ? "Signing in..." : "Sign in"}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Login por WhatsApp */}
                    {activeMethod === "whatsapp" && (
                        <form onSubmit={handleSubmitWhatsApp(verifyWhatsAppCode)}>
                            <div className="space-y-6">
                                <div>
                                    <Label>
                                        WhatsApp Phone Number <span className="text-error-500">*</span>
                                    </Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Input
                                                type="tel"
                                                id="whatsappPhone"
                                                placeholder="+55 (11) 98765-4321"
                                                {...registerWhatsApp("phone", {
                                                    onChange: () => setVerificationSent(false)
                                                })}
                                                error={!!errorsWhatsApp.phone}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={sendWhatsAppCode}
                                            disabled={isSendingCode || countdown > 0}
                                            className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                        >
                                            {isSendingCode ? "Sending..." : countdown > 0 ? `${countdown}s` : "Send Code"}
                                        </button>
                                    </div>
                                    {errorsWhatsApp.phone && (
                                        <p className="mt-1 text-sm text-error-500">
                                            {errorsWhatsApp.phone.message}
                                        </p>
                                    )}
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        We'll send a verification code via WhatsApp
                                    </p>
                                </div>

                                {verificationSent && (
                                    <div>
                                        <Label>
                                            Verification Code <span className="text-error-500">*</span>
                                        </Label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <Input
                                                    type="text"
                                                    id="whatsappCode"
                                                    placeholder="Enter 6-digit code"
                                                    maxLength={6}
                                                    {...registerWhatsApp("code")}
                                                    error={!!errorsWhatsApp.code}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isVerifyingCode}
                                                className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                            >
                                                {isVerifyingCode ? "Verifying..." : "Verify"}
                                            </button>
                                        </div>
                                        {errorsWhatsApp.code && (
                                            <p className="mt-1 text-sm text-error-500">
                                                {errorsWhatsApp.code.message}
                                            </p>
                                        )}

                                        <div className="flex justify-between items-center mt-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Enter the code sent to your WhatsApp
                                            </p>
                                            <button
                                                type="button"
                                                onClick={resendWhatsAppCode}
                                                disabled={countdown > 0}
                                                className="text-sm text-brand-500 hover:text-brand-600 disabled:text-gray-400"
                                            >
                                                {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <Button
                                        className="w-full"
                                        size="sm"
                                        disabled={!verificationSent || isVerifyingCode}
                                    >
                                        {isVerifyingCode ? "Verifying..." : "Login with WhatsApp"}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Login por Google */}
                    {activeMethod === "google" && (
                        <div className="text-center">
                            <p className="mb-6 text-gray-600 dark:text-gray-300">
                                Click the button below to sign in with your Google account.
                            </p>

                            <button
                                onClick={() => loginWithGoogle()}
                                disabled={isLoading}
                                className="w-full inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                                        fill="#EB4335"
                                    />
                                </svg>
                                {isLoading ? "Processing..." : "Sign in with Google"}
                            </button>

                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                You'll be redirected to Google to authorize this application.
                            </p>
                        </div>
                    )}

                    <div className="mt-5">
                        <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                            Don&apos;t have an account? {""}
                            <Link
                                to="/signup"
                                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                            >
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}