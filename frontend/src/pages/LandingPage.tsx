
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
    Shield,
    FileCheck,
    Building2,
    Users,
    Database,
    Lock,
    ArrowRight,
    Stethoscope,
    Trees,
    CheckCircle2,
    Globe,
    Settings,
} from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-primary/20 transition-colors duration-300">
            {/* Theme Toggle */}
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle />
            </div>

            {/* -------------------- HERO SECTION -------------------- */}
            <section className="relative px-6 pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden">
                {/* Abstract Background Elemets */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-3xl -z-10 opacity-60 dark:opacity-40 mix-blend-multiply dark:mix-blend-normal" />
                <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-purple-100/50 dark:bg-purple-900/20 rounded-full blur-3xl -z-10 opacity-50 dark:opacity-40 mix-blend-multiply dark:mix-blend-normal" />

                <div className="max-w-5xl mx-auto text-center space-y-8 animate-in fade-in zoom-in duration-700">


                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.1]">
                        TrustID
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium">
                        A Consent-First Digital Identity Platform.
                    </p>

                    <div className="flex flex-col items-center gap-4 pt-4">
                        <Link to="/login">
                            <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-lg shadow-primary/20 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white transition-all hover:scale-105 active:scale-95">
                                Enter TrustID <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Sign up or sign in — roles are detected automatically
                        </p>
                    </div>
                </div>

                {/* Floating Icons - Subtle Movement */}
                <div className="absolute top-1/4 left-10 md:left-20">
                    <AnimatedFileCheck className="w-16 h-16 text-slate-300" />
                </div>
                <div className="absolute top-1/3 right-10 md:right-32 animate-[spin_20s_linear_infinite]">
                    <Settings className="w-20 h-20 text-slate-300" />
                </div>
                <div className="absolute bottom-20 left-10 md:left-1/4 animate-[pulse_4s_ease-in-out_infinite]">
                    <Shield className="w-24 h-24 text-slate-300" />
                </div>
                <div className="absolute top-20 left-1/2 animate-[pulse_5s_ease-in-out_infinite]">
                    <Database className="w-12 h-12 text-blue-300" />
                </div>

                {/* Hero Visual - Simplified Security Symbol */}
                <div className="mt-20 flex justify-center opacity-90">
                    <div className="relative">
                        <Shield className="w-40 h-40 text-emerald-600 drop-shadow-sm" />
                        <div className="absolute bottom-6 right-6 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center border-4 border-slate-50">
                            <Lock className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
            </section>

            {/* -------------------- FEATURES CARDS -------------------- */}
            <section className="py-20 px-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-y border-slate-100 dark:border-slate-800">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
                    {/* Card 1 */}
                    <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">1. Citizen Owns Data</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                Identity Vault Integration
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                Attribute-Level Control
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                Automatic Verify & Sync
                            </li>
                        </ul>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <FileCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">2. Consent-Based Access</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                Purpose-Bound Requests
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                Time-Limited Grants
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                Revoke Instantly
                            </li>
                        </ul>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Shield className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">3. Government Oversight</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                Role-Based Access
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                Immutable Audit Logs
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                Regulatory Compliance
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* -------------------- BUILT FOR TRUST -------------------- */}
            <section className="py-24 px-6 bg-white dark:bg-slate-950">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-slate-900 dark:text-slate-50">
                        Built for Trust. Engineered for Security.
                    </h2>

                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
                        {/* Feature 1 */}
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                                <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold mb-2 text-slate-900 dark:text-slate-100">Identity Vault</h4>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Modular data blocks for Healthcare, Finance, and Civic data.
                                </p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                <FileCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold mb-2 text-slate-900 dark:text-slate-100">Consent Management</h4>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Granular permission controls. Data is never shared without explicit approval.
                                </p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                                <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold mb-2 text-slate-900 dark:text-slate-100">Service Integration</h4>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Seamless API for Banks, Hospitals, and Civic bodies to verify citizens.
                                </p>
                            </div>
                        </div>

                        {/* Feature 4 */}
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                                <Globe className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold mb-2 text-slate-900 dark:text-slate-100">Government Portals</h4>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Dedicated dashboards for authority oversight and entity verification.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* -------------------- IMPACT CASES -------------------- */}
            <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Real-World Impact</span>
                        <h2 className="text-3xl md:text-4xl font-bold mt-2 text-slate-900 dark:text-slate-50">Solving Critical Challenges</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Case 1 */}
                        <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all hover:border-blue-100 dark:hover:border-blue-900/50">
                            <div className="w-10 h-10 rounded bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-6">
                                <Stethoscope className="w-5 h-5 text-red-500 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">Healthcare</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                "Hospitals verify allergies and medical info instantly without storing patient data permanently, reducing liability and improving care."
                            </p>
                        </div>

                        {/* Case 2 */}
                        <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all hover:border-blue-100 dark:hover:border-blue-900/50">
                            <div className="w-10 h-10 rounded bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center mb-6">
                                <Building2 className="w-5 h-5 text-sky-500 dark:text-sky-400" />
                            </div>
                            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">Urban Services</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                "Instant address verification for utility connections and municipal services, eliminating paperwork and physical visits."
                            </p>
                        </div>

                        {/* Case 3 */}
                        <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all hover:border-blue-100 dark:hover:border-blue-900/50">
                            <div className="w-10 h-10 rounded bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-6">
                                <Trees className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">Agriculture</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                "Farmers share validated land ownership and soil health data to claim subsidies instantly and securely."
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* -------------------- FOUNDATION FOOTER -------------------- */}
            <section className="bg-slate-900 text-white py-24 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-center mb-8">
                        <Shield className="w-12 h-12 text-green-400" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Security is not a feature. It's the foundation.
                    </h2>

                    <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-slate-400 text-sm font-medium">
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" /> Read-Only Verification
                        </span>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" /> Government Regulated
                        </span>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" /> Consent-First Architecture
                        </span>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" /> Immutable Logic
                        </span>
                    </div>
                </div>
            </section>

            {/* -------------------- FINAL CTA -------------------- */}
            <section className="bg-white dark:bg-slate-950 py-24 px-6 text-center border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-50">Built for citizens. Trusted by governments.</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">Join the future of Digital Identity today.</p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <Link to="/login">
                            <Button size="lg" className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-900/20">
                                Sign in as Citizen
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button size="lg" variant="outline" className="h-12 px-8 rounded-full bg-transparent border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800">
                                Sign in as Organization
                            </Button>
                        </Link>
                        <Link to="/govt-login">
                            <Button size="lg" variant="outline" className="h-12 px-8 rounded-full bg-transparent border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800">
                                Government Admin
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="bg-slate-950 py-12 text-center text-slate-600 text-sm">
                <p className="mb-4">&copy; {new Date().getFullYear()} TrustID. Official Government Digital Infrastructure.</p>

                <div className="max-w-md mx-auto pt-6 border-t border-slate-900">
                    <p className="font-semibold text-slate-500 mb-2 uppercase tracking-wide text-xs">Team S,YL</p>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-slate-500">
                        <span>Daksh Shah</span>
                        <span>Mahir Shah</span>
                        <span>Ansh Patel</span>
                        <span>Sachi Patel</span>
                    </div>
                </div>
            </footer>
        </div >
    );
}

function AnimatedFileCheck({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <path
                d="m9 15 2 2 4-4"
                className="animate-draw-check"
            />
            <style>{`
                .animate-draw-check {
                    stroke-dasharray: 10;
                    stroke-dashoffset: 10;
                    animation: drawCheck 4s ease-in-out infinite;
                }
                @keyframes drawCheck {
                    0% { stroke-dashoffset: 10; opacity: 0; }
                    20% { stroke-dashoffset: 0; opacity: 1; }
                    80% { stroke-dashoffset: 0; opacity: 1; }
                    100% { stroke-dashoffset: 0; opacity: 0; }
                }
            `}</style>
        </svg>
    );
}
