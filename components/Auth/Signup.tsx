"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  AtSign,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowRight,
  Shield,
  UserCheck,
  MessageSquare,
  Loader2,
} from "lucide-react";

interface FormData {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
}

export default function Signup() {
  const [step, setStep] = useState<"signup" | "otp">("signup");
  const [formData, setFormData] = useState<FormData>({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState<number>(0);
  const [isOtpExpired, setIsOtpExpired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errors, setErrors] = useState<Partial<FormData & { otp: string }>>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false,
  });
  const [usernameStatus, setUsernameStatus] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    message: string;
  }>({
    isChecking: false,
    isAvailable: null,
    message: "",
  });

  const formRef = useRef<HTMLDivElement>(null);
  const otpRef = useRef<HTMLDivElement>(null);

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

  // OTP step animation
  useEffect(() => {
    if (step === "otp" && otpRef.current) {
      gsap.fromTo(
        otpRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
    }
  }, [step]);

  // OTP expiry timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (otpExpiresAt && step === "otp") {
      interval = setInterval(() => {
        const now = new Date();
        const timeLeft = Math.max(0, Math.floor((otpExpiresAt.getTime() - now.getTime()) / 1000));
        
        setOtpTimeLeft(timeLeft);
        
        if (timeLeft === 0) {
          setIsOtpExpired(true);
          setErrors({ otp: "OTP has expired. Please request a new one." });
          clearInterval(interval);
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [otpExpiresAt, step]);

  // Resend cooldown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Username availability checker with debounce
  useEffect(() => {
    const checkUsername = async (username: string) => {
      if (!username || username.length < 3) {
        setUsernameStatus({
          isChecking: false,
          isAvailable: null,
          message: "",
        });
        return;
      }

      setUsernameStatus((prev) => ({ ...prev, isChecking: true }));

      try {
        // console.log("Checking username:", username); // Debug log

        const response = await fetch("/api/auth/checkusername", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username }),
        });

        // console.log("Response status:", response.status); // Debug log

        const data = await response.json();
        // console.log("Response data:", data); // Debug log

        if (response.ok) {
          setUsernameStatus({
            isChecking: false,
            isAvailable: true,
            message: data.message,
          });
        } else {
          setUsernameStatus({
            isChecking: false,
            isAvailable: false,
            message: data.message,
          });
        }
      } catch (error) {
        console.error("Username check error:", error); // Debug log
        setUsernameStatus({
          isChecking: false,
          isAvailable: null,
          message: "Error checking username",
        });
      }
    };

    // Debounce username checking
    const timeoutId = setTimeout(() => {
      checkUsername(formData.username);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  // Password strength checker
  useEffect(() => {
    const checkPasswordStrength = (password: string): PasswordStrength => {
      const feedback: string[] = [];
      let score = 0;

      if (password.length >= 8) {
        score += 1;
      } else if (password.length > 0) {
        feedback.push("At least 8 characters");
      }

      if (/[A-Z]/.test(password)) {
        score += 1;
      } else if (password.length > 0) {
        feedback.push("One uppercase letter");
      }

      if (/[a-z]/.test(password)) {
        score += 1;
      } else if (password.length > 0) {
        feedback.push("One lowercase letter");
      }

      if (/\d/.test(password)) {
        score += 1;
      } else if (password.length > 0) {
        feedback.push("One number");
      }

      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score += 1;
      } else if (password.length > 0) {
        feedback.push("One special character");
      }

      return {
        score,
        feedback,
        isValid: score === 5, // Must meet ALL 5 requirements
      };
    };

    setPasswordStrength(checkPasswordStrength(formData.password));
  }, [formData.password]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (usernameStatus.isAvailable === false) {
      newErrors.username = "Username is not available";
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!passwordStrength.isValid) {
      newErrors.password = "Password doesn't meet requirements";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error)
        throw new Error(data.error || "Signup failed");
        setErrors(data.error);
      }

      

      // console.log("OTP Sent", data);

      // Set OTP expiry time
      if (data.otpExpiresAt) {
        setOtpExpiresAt(new Date(data.otpExpiresAt));
        setIsOtpExpired(false);
      }

      // Move to OTP step
      setStep("otp");
      setResendCooldown(60); // 60 second cooldown
    } catch (error) {
      console.error("Signup error:", error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim()) {
      setErrors({ otp: "Please enter the OTP" });
      return;
    }

    if (otp.length !== 6) {
      setErrors({ otp: "OTP must be 6 digits" });
      return;
    }

    if (isOtpExpired) {
      setErrors({ otp: "OTP has expired. Please request a new one." });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "OTP verification failed");
      }

      // Handle successful signup
      // console.log("Signup successful!", data);
      
      // You can redirect to dashboard or login page here
      // window.location.href = "/dashboard";
      // or use Next.js router
      alert("Account created successfully! You can now log in.");
      window.location.href = "/auth/login";
      
    } catch (error) {
      console.error("OTP verification error:", error);
      setErrors({ 
        otp: error instanceof Error ? error.message : "Invalid OTP. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setIsResendingOtp(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "resend",
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend OTP");
      }

      // Set new expiry time if provided
      if (data.otpExpiresAt) {
        setOtpExpiresAt(new Date(data.otpExpiresAt));
        setIsOtpExpired(false);
      }

      setResendCooldown(60); // Reset cooldown
      setOtp(""); // Clear current OTP
      
      // Show success message (you could use a toast notification here)
      alert("OTP sent successfully!");
      
    } catch (error) {
      console.error("Resend OTP error:", error);
      alert(error instanceof Error ? error.message : "Failed to resend OTP");
    } finally {
      setIsResendingOtp(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 1) return "bg-red-500";
    if (passwordStrength.score <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 1) return "Weak";
    if (passwordStrength.score <= 3) return "Medium";
    return "Strong";
  };

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (step === "otp") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div
          ref={otpRef}
          className="opacity-0 w-full max-w-md mx-auto rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
              <Shield className="w-8 h-8 text-zinc-600 dark:text-zinc-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              Verify Your Email
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm">
              We've sent a 6-digit code to{" "}
              <span className="font-medium">{formData.email}</span>
            </p>
            
            {/* OTP Timer */}
            {otpExpiresAt && (
              <div className={`mt-3 p-3 rounded-lg ${
                isOtpExpired 
                  ? "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800" 
                  : "bg-zinc-50 dark:bg-zinc-800"
              }`}>
                {isOtpExpired ? (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <X className="w-4 h-4" />
                    <span className="text-sm font-medium">OTP Expired - Please request a new one</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">
                      Code expires in: <span className="font-mono font-medium text-zinc-900 dark:text-white">{formatTimeLeft(otpTimeLeft)}</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(value);
                  if (errors.otp) {
                    setErrors((prev) => ({ ...prev, otp: undefined }));
                  }
                }}
                placeholder="123456"
                className={`w-full px-4 py-3 rounded-xl border text-center text-lg font-mono tracking-widest ${
                  errors.otp
                    ? "border-red-300 dark:border-red-700"
                    : isOtpExpired
                    ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950"
                    : "border-zinc-300 dark:border-zinc-700"
                } bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
                maxLength={6}
                disabled={isOtpExpired}
              />
              {errors.otp && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.otp}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6 || isOtpExpired}
              className="w-full rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-6 py-3 font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isOtpExpired ? (
                <>
                  <X size={18} />
                  OTP Expired
                </>
              ) : (
                <>
                  <UserCheck size={18} />
                  Verify & Complete Signup
                </>
              )}
            </button>

            <div className="text-center space-y-3">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isResendingOtp}
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResendingOtp ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </span>
                ) : resendCooldown > 0 ? (
                  `Resend OTP in ${resendCooldown}s`
                ) : isOtpExpired ? (
                  "Send New OTP"
                ) : (
                  "Resend OTP"
                )}
              </button>
              
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("signup");
                    setOtp("");
                    setOtpExpiresAt(null);
                    setIsOtpExpired(false);
                    setErrors({});
                  }}
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  ← Back to signup
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
            Join Ping
          </h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm">
            Create your account to start connecting
          </p>
        </div>

        <form onSubmit={handleSignupSubmit} className="space-y-6">
          {/* Username */}
          <div className="form-field opacity-0 translate-y-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Username
            </label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="johndoe"
                className={`w-full pl-11 pr-11 py-3 rounded-xl border ${
                  errors.username
                    ? "border-red-300 dark:border-red-700"
                    : usernameStatus.isAvailable === true
                    ? "border-green-300 dark:border-green-700"
                    : usernameStatus.isAvailable === false
                    ? "border-red-300 dark:border-red-700"
                    : "border-zinc-300 dark:border-zinc-700"
                } bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus.isChecking ? (
                  <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                ) : usernameStatus.isAvailable === true ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : usernameStatus.isAvailable === false ? (
                  <X className="w-5 h-5 text-red-500" />
                ) : null}
              </div>
            </div>

            {/* Username Status Message */}
            {usernameStatus.message && !errors.username && (
              <p
                className={`mt-2 text-sm ${
                  usernameStatus.isAvailable === true
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {usernameStatus.message}
              </p>
            )}

            {errors.username && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.username}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="form-field opacity-0 translate-y-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder="John Doe"
                className={`w-full pl-11 pr-4 py-3 rounded-xl border ${
                  errors.fullName
                    ? "border-red-300 dark:border-red-700"
                    : "border-zinc-300 dark:border-zinc-700"
                } bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent`}
              />
            </div>
            {errors.fullName && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="form-field opacity-0 translate-y-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="john@example.com"
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

          {/* Phone */}
          <div className="form-field opacity-0 translate-y-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={`w-full pl-11 pr-4 py-3 rounded-xl border ${
                  errors.phone
                    ? "border-red-300 dark:border-red-700"
                    : "border-zinc-300 dark:border-zinc-700"
                } bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent`}
              />
            </div>
            {errors.phone && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.phone}
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
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Create a strong password"
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

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {getPasswordStrengthText()}
                  </span>
                </div>

                {passwordStrength.isValid ? (
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <Check size={12} />
                    Password meets all requirements
                  </div>
                ) : (
                  passwordStrength.feedback.length > 0 && (
                    <div className="space-y-1">
                      {passwordStrength.feedback.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-xs text-zinc-500"
                        >
                          <X size={12} className="text-red-500" />
                          {item}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {errors.password && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-field opacity-0 translate-y-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                placeholder="Confirm your password"
                className={`w-full pl-11 pr-11 py-3 rounded-xl border ${
                  errors.confirmPassword
                    ? "border-red-300 dark:border-red-700"
                    : "border-zinc-300 dark:border-zinc-700"
                } bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="form-field opacity-0 translate-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-6 py-3 font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* Login Link */}
          <div className="form-field opacity-0 translate-y-4 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Already have an account?{" "}
              <a
                href="/auth/login"
                className="font-medium text-zinc-900 dark:text-white hover:underline"
              >
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
