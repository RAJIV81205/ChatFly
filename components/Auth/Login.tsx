"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  KeyRound,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

interface FormData {
  email: string;
  password: string;
}

const Login = () => {
  const formRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const [form, setForm] = useState<FormData>({
    email: "",
    password: "",
  });

  // Animation on mount
  useEffect(() => {
    if (!formRef.current) return;

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
    });

    tl.to(formRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
    }).to(
      ".form-field",
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.1,
      },
      "-=0.3"
    );

    return () => {
      tl.kill();
    };
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------- LOGIN ---------- */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // success → redirect / set auth state
      console.log("Logged in successfully:", data);
      alert("Login successful! Welcome back.");
      // You can redirect to dashboard here
      // window.location.href = "/dashboard";
      
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ 
        password: error instanceof Error ? error.message : "Login failed. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div
        ref={formRef}
        className="opacity-0 translate-y-6 w-full max-w-md mx-auto rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-8 px-6 shadow-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
            <MessageSquare className="w-8 h-8 text-zinc-600 dark:text-zinc-400" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm">
            Sign in to your Ping account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div className="form-field opacity-0 translate-y-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="you@example.com"
                className={`w-full pl-11 pr-4 py-3 rounded-xl border ${
                  errors.email
                    ? "border-red-300 dark:border-red-700"
                    : "border-zinc-300 dark:border-zinc-700"
                } bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent`}
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="form-field opacity-0 translate-y-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-11 pr-11 py-3 rounded-xl border ${
                  errors.password
                    ? "border-red-300 dark:border-red-700"
                    : "border-zinc-300 dark:border-zinc-700"
                } bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          {/* Forgot password */}
          <div className="form-field opacity-0 translate-y-4">
            <a
              href="/auth/forgot-password"
              className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <KeyRound size={16} />
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <div className="form-field opacity-0 translate-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-6 py-3 font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </div>

          {/* Signup Link */}
          <div className="form-field opacity-0 translate-y-4 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Don't have an account?{" "}
              <a
                href="/auth/register"
                className="font-medium text-zinc-900 dark:text-white hover:underline"
              >
                Sign up
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
