import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Smartphone, ArrowRight, Monitor, MapPin, Clock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEntity } from "@/context/EntityContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { type UserSecurityStats } from "@/types";
import { apiService } from "@/services/apiService";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, verifyOtp, sessions, terminateSession } = useEntity();
  const [step, setStep] = useState<"credentials" | "otp" | "sessions">("credentials");

  // Form State
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loginMethod, setLoginMethod] = useState<"PHONE" | "EMAIL">("PHONE");

  // Resend Timer
  const [resendTimer, setResendTimer] = useState(120);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds


  // Reset Password State
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState<"phone" | "verify">("phone");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    // Check for forced logout
    if (localStorage.getItem('session_terminated')) {
      toast.error("Session Terminated", {
        description: "You have been logged out.",
        duration: 4000,
      });
      localStorage.removeItem('session_terminated');
    }

    let interval: NodeJS.Timeout;
    if (step === "otp" || (isResetMode && resetStep === "verify")) {
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, isResetMode, resetStep]);

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const payload = loginMethod === 'PHONE' ? { phone } : { email };
      const res = await apiService.auth.sendOtp(payload);
      if (res.error) {
        setError(res.error);
      } else {
        setResetStep("verify");
        setResendTimer(120);
        setTimeLeft(300);
        toast.success("OTP sent to your phone");
      }
    } catch (err: any) {
      console.error("Send OTP Error:", err);
      setError(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.auth.resetPassword(
        loginMethod === 'PHONE' ? phone : "",
        otp,
        newPassword,
        loginMethod === 'EMAIL' ? email : undefined
      );
      if (res.error) {
        setError(res.error);
      } else {
        toast.success("Password reset successfully! Please login.");
        setIsResetMode(false);
        setResetStep("phone");
        setPassword("");
        setOtp("");
        setNewPassword("");
      }
    } catch (err) {
      setError("Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /* Handlers Restored */
  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const result = await login(phone, password);
      if (result.success) {
        setResendTimer(120);
        setTimeLeft(300);
      } else {
        setError("Failed to resend OTP");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(
        loginMethod === 'PHONE' ? phone : undefined,
        password,
        loginMethod === 'EMAIL' ? email : undefined
      );

      if (result.success) {
        if (result.token) {
          toast.success("Welcome back!");
          navigate("/");
        } else {
          setStep("otp");
          setResendTimer(120);
          setTimeLeft(300);
        }
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyOtp(otp);
      if (result.success) {
        setStep("sessions");
      } else {
        setError(result.error || "Invalid OTP");
      }
    } catch (err) {
      setError("Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    navigate("/");
  };

  // RENDER LOGIC UPDATE
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Shield className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">TrustID</h1>
            <p className="text-sm text-muted-foreground">Digital Identity Platform</p>
          </div>
        </div>

        <div className="section-card">

          {/* RESET PASSWORD MODE */}
          {isResetMode ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setIsResetMode(false)} className="text-muted-foreground hover:text-foreground">
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </button>
                <h2 className="text-xl font-semibold text-foreground">Reset Password</h2>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {resetStep === 'phone' ? (
                <form onSubmit={handleSendResetOtp} className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter your {loginMethod === 'PHONE' ? 'phone number' : 'email address'} to receive a verification code.
                  </p>

                  {loginMethod === 'PHONE' ? (
                    <div className="space-y-2">
                      <Label htmlFor="reset-phone">Phone Number</Label>
                      <Input
                        id="reset-phone"
                        type="tel"
                        placeholder="Enter phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email Address</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="name@organization.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send OTP'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter the OTP sent to {loginMethod === 'PHONE' ? phone : email} and your new password.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="reset-otp">OTP Code</Label>
                    <Input
                      id="reset-otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </form>
              )}
            </>
          ) : (
            /* NORMAL LOGIN MODE */
            step === "credentials" && (
              <>
                <h2 className="text-xl font-semibold text-foreground mb-2">Sign In</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Enter your credentials to access your digital identity
                </p>

                {/* Login Method Tabs */}
                <div className="flex p-1 bg-muted rounded-lg mb-6">
                  <button
                    type="button"
                    onClick={() => setLoginMethod("PHONE")}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${loginMethod === "PHONE" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Individual (Mobile)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("EMAIL")}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${loginMethod === "EMAIL" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Organization (Email)
                  </button>
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleCredentialsSubmit} className="space-y-4">

                  {loginMethod === 'PHONE' ? (
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="email">Official Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@organization.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsResetMode(true)}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            ))}

          {step === "otp" && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Verify OTP</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter code sent to +91 {phone.slice(0, 2)}XX..
                  </p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">One-Time Password</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="text-center text-lg tracking-widest"
                    required
                    disabled={isLoading}
                  />
                  <div className="flex flex-col items-center gap-2 mt-2">
                    <p className="text-xs text-muted-foreground text-center">
                      OTP expires in {formatTime(timeLeft)}
                    </p>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0 || isLoading}
                      className="text-xs text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                    >
                      {resendTimer > 0
                        ? `Resend OTP in ${formatTime(resendTimer)}`
                        : "Resend OTP"}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Sign In"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  Use a different number
                </button>
              </form>
            </>
          )}

          {step === "sessions" && (
            <>
              <h2 className="text-xl font-semibold text-foreground mb-2">Active Sessions</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Review your active sessions before continuing
              </p>

              <div className="space-y-3 mb-6">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 rounded-lg border ${session.current ? "border-primary bg-primary/5" : "border-border"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Monitor className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {session.device}
                            {session.current && (
                              <span className="ml-2 text-xs text-primary font-normal">
                                (Current)
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {session.location}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {session.lastActive}
                          </div>
                        </div>
                      </div>
                      {!session.current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => terminateSession(session.id)}
                        >
                          Terminate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleContinue} className="w-full">
                Continue to Dashboard
              </Button>
            </>
          )}
        </div>

        {step === "credentials" && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Create Account
            </Link>
          </p>
        )}

        {/* Footnote Link */}
        <div className="mt-8 text-center border-t pt-4">
          <Link to="/govt-login" className="text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1">
            <Monitor className="h-3 w-3" />
            Government Services Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
