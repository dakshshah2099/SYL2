import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, ArrowRight, Loader2, AlertCircle, UserPlus, Smartphone, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiService } from "@/services/apiService";
import { toast } from "sonner";
import { useEntity } from "@/context/EntityContext";

import { ThemeToggle } from "@/components/ThemeToggle";

export function SignupPage() {
    const navigate = useNavigate();
    const { switchEntity, login, verifyOtp } = useEntity();

    // State
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [accountType, setAccountType] = useState<'INDIVIDUAL' | 'ORG'>('INDIVIDUAL');

    // Org Request State
    const [isOrgRequestMode, setIsOrgRequestMode] = useState(false);
    const [orgName, setOrgName] = useState("");
    const [orgEmail, setOrgEmail] = useState("");
    const [orgRegNo, setOrgRegNo] = useState("");
    const [jurisdiction, setJurisdiction] = useState("");
    const [address, setAddress] = useState("");
    const [pincode, setPincode] = useState("");

    const fetchCityState = async (pin: string) => {
        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
            const data = await response.json();
            if (data && data[0] && data[0].Status === 'Success') {
                const details = data[0].PostOffice[0];
                setAddress(details.District); // Using District as generic Address/City placeholder
                setJurisdiction(details.State);
                toast.success("Location fetched!");
            } else {
                toast.error("Invalid Pincode");
            }
        } catch (e) {
            toast.error("Failed to fetch location");
        }
    };

    // Resend Timer
    const [resendTimer, setResendTimer] = useState(120);
    const [timeLeft, setTimeLeft] = useState(300);

    // Flow State
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);
    const [isExistingUser, setIsExistingUser] = useState(false);
    const [isNewRegistration, setIsNewRegistration] = useState(false);
    const [showProfiles, setShowProfiles] = useState(false);
    const [availableProfiles, setAvailableProfiles] = useState<any[]>([]);

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showOtpInput) {
            interval = setInterval(() => {
                setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
                setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [showOtpInput]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleResendOtp = async () => {
        setIsLoading(true);
        try {
            const result = await login(phone, password);
            if (result.success) {
                setResendTimer(120);
                setTimeLeft(300);
                toast.success("OTP sent again");
            } else {
                setError("Failed to resend OTP");
            }
        } catch (e) {
            setError("Network error");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Org Request Submit
    const handleOrgRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await apiService.auth.orgRequest({
                name: orgName,
                email: orgEmail,
                registrationNumber: orgRegNo,
                jurisdiction,
                address
            });

            if (res.success) {
                toast.success("Request submitted! We will review and email you.");
                setIsOrgRequestMode(false);
                setOrgName("");
                setOrgEmail("");
            } else {
                setError(res.error || "Failed to submit request");
            }
        } catch (e) {
            setError("Network error");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 1: Check Phone
    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await apiService.auth.checkPhone(phone);
            if (res.exists) {
                setIsExistingUser(true);
            } else {
                setIsNewRegistration(true);
            }
        } catch (e) {
            setError("Failed to verify phone number");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2A: New Registration (Original Logic)
    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setIsLoading(false);
            return;
        }

        try {
            // Always INDIVIDUAL here
            const result = await apiService.auth.register(phone, password, 'INDIVIDUAL');
            if (result.success) {
                toast.success("Account created successfully! Please login.");
                navigate("/login");
            } else {
                setError(result.error || "Registration failed");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2B: Login & Fetch Profiles
    const handleLoginAndAddProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. Login using Context to set tempAuth
            const loginRes = await login(phone, password);
            if (!loginRes.success) {
                setError(loginRes.error || "Invalid password");
                return;
            }

            toast.success("OTP sent to your phone");

            // Transition to OTP step
            setShowOtpInput(true);
            setResendTimer(120);
            setTimeLeft(300);
            setIsExistingUser(false); // Hide login form
            setIsCheckingPhone(true); // Hide initial phone input

        } catch (e) {
            setError("Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3: Verify OTP
    const handleOtpVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Use Context verifyOtp to update global auth state
            const res = await verifyOtp(otp);
            if (res.success) {
                // Fetch profiles
                const entities = await apiService.entities.getAll();

                if (Array.isArray(entities)) {
                    setAvailableProfiles(entities);
                    setShowOtpInput(false); // Hide OTP
                    setShowProfiles(true); // Show Profiles
                    // Ensure other steps are hidden
                    setIsCheckingPhone(true); // Hack to hide first step: !isCheckingPhone will be false
                } else {
                    setError("Failed to load profiles");
                }
            } else {
                setError(res.error || "Invalid OTP");
            }
        } catch (e) {
            setError("Verification failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProfile = (type: 'INDIVIDUAL' | 'ORG') => {
        if (type === 'ORG') {
            navigate('/org-setup', { state: { createMode: true, type: 'ORG' } });
        } else {
            navigate('/profile-setup', { state: { createMode: true, type: 'INDIVIDUAL' } });
        }
    };

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
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                {isOrgRequestMode ? <Building className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">
                                    {isOrgRequestMode ? "Organization Request" : "Create Individual Account"}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {isOrgRequestMode ? "Submit your details for verification" : "Join the unified identity network"}
                                </p>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* MODE: ORG REQUEST FORM */}
                        {isOrgRequestMode && (
                            <form onSubmit={handleOrgRequestSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="orgName">Organization Name</Label>
                                    <Input id="orgName" value={orgName} onChange={e => setOrgName(e.target.value)} required disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="orgEmail">Official Email</Label>
                                    <Input id="orgEmail" type="email" value={orgEmail} onChange={e => setOrgEmail(e.target.value)} required disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="orgRegNo">Registration Number</Label>
                                    <Input id="orgRegNo" value={orgRegNo} onChange={e => setOrgRegNo(e.target.value)} required disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pincode">Pincode</Label>
                                    <Input
                                        id="pincode"
                                        value={pincode}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setPincode(val);
                                            if (val.length === 6) fetchCityState(val);
                                        }}
                                        maxLength={6}
                                        required
                                        disabled={isLoading}
                                        placeholder="Enter Pincode"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="jurisdiction">Jurisdiction</Label>
                                        <Input id="jurisdiction" value={jurisdiction} readOnly className="bg-muted" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">City / District</Label>
                                        <Input id="address" value={address} readOnly className="bg-muted" required />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Request"}
                                </Button>
                                <Button variant="ghost" className="w-full" onClick={() => setIsOrgRequestMode(false)} disabled={isLoading}>
                                    Back to Individual Signup
                                </Button>
                            </form>
                        )}

                        {/* MODE: INDIVIDUAL FLOW (Checking Phone) */}
                        {!isOrgRequestMode && !isCheckingPhone && !isExistingUser && !isNewRegistration && (
                            <form onSubmit={handlePhoneSubmit} className="space-y-4">
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
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Checking...
                                        </>
                                    ) : (
                                        <>
                                            Continue
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                                    </div>
                                </div>
                                <Button variant="outline" className="w-full" type="button" onClick={() => setIsOrgRequestMode(true)}>
                                    <Building className="mr-2 h-4 w-4" />
                                    Register as Organization
                                </Button>
                            </form>
                        )}

                        {/* MODE: INDIVIDUAL NEW REGISTRATION (Password) */}
                        {!isOrgRequestMode && isNewRegistration && (
                            <form onSubmit={handleSignupSubmit} className="space-y-4">
                                <Alert className="bg-muted">
                                    <AlertDescription>Creating account for {phone}</AlertDescription>
                                </Alert>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Create Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Create a password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Confirm password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating Account...
                                        </>
                                    ) : "Sign Up"}
                                </Button>
                                <Button variant="ghost" className="w-full" onClick={() => setIsNewRegistration(false)} disabled={isLoading}>
                                    Back
                                </Button>
                            </form>
                        )}

                        {/* MODE: EXISTING USER (Login) */}
                        {!isOrgRequestMode && isExistingUser && (
                            <div className="space-y-4">
                                <Alert className="bg-primary/5 border-primary/20">
                                    <UserPlus className="h-4 w-4 text-primary" />
                                    <AlertDescription>
                                        This number is already registered. Login to add a new profile.
                                    </AlertDescription>
                                </Alert>

                                <form onSubmit={handleLoginAndAddProfile} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Phone Number</Label>
                                        <Input value={phone} disabled className="bg-muted" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="loginPassword">Password</Label>
                                        <Input
                                            id="loginPassword"
                                            type="password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : "Login & View Profiles"}
                                    </Button>
                                    <Button variant="ghost" className="w-full" onClick={() => setIsExistingUser(false)} disabled={isLoading}>
                                        Back
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* MODE: OTP VERIFICATION */}
                        {!isOrgRequestMode && showOtpInput && (
                            <form onSubmit={handleOtpVerify} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Enter OTP</Label>
                                    <Input
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        placeholder="6-digit code"
                                        maxLength={6}
                                        className="text-center tracking-widest text-lg"
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
                                    {isLoading ? <Loader2 className="animate-spin" /> : "Verify & View Profiles"}
                                </Button>
                            </form>
                        )}

                        {/* MODE: SHOW PROFILES */}
                        {!isOrgRequestMode && showProfiles && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-muted-foreground">Select an Existing Profile</h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {availableProfiles.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                switchEntity(p.id);
                                                toast.success(`Welcome back, ${p.name}`);
                                                navigate("/dashboard");
                                            }}
                                            className="p-3 border rounded-md flex items-center gap-3 cursor-pointer hover:bg-muted transition-colors"
                                        >
                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                {p.avatar ? <img src={p.avatar} className="h-full w-full rounded-full" /> : <div className="text-xs">{p.name.slice(0, 2)}</div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{p.name}</p>
                                                <p className="text-xs text-muted-foreground">{p.type}</p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    ))}
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button onClick={() => handleCreateProfile('INDIVIDUAL')} variant="outline" className="w-full">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Personal
                                    </Button>
                                    {/* Organizations cannot be created atomically here anymore without request, but maybe keep for consistency if they have a real account? No, we removed self-reg. */}
                                    {/* Let's remove Org creation from here too, or redirect to Request? */}
                                    {/* Actually, if they are logged in, maybe they can add an Org Profile IF they have permission? 
                                        But wait, Org Profiles are tied to Org Accounts (Email). Individual Accounts (Phone) invoke Individual Profiles.
                                        So an Individual User cannot create an Org Profile directly under their Phone account in this new model?
                                        The prompt said: "Organizations Request Approval...". 
                                        So yes, remove Org Button here. Only Personal.
                                    */}
                                    <Button disabled variant="ghost" className="w-full opacity-50 cursor-not-allowed">
                                        <Building className="mr-2 h-4 w-4" />
                                        Org (Request Only)
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                </div>

                {!isExistingUser && !showOtpInput && !showProfiles && (
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link to="/login" className="text-primary hover:underline font-medium">
                            Sign In
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
