import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useEntity } from '@/context/EntityContext'; // Using context for auth methods
import { apiService } from '@/services/apiService';
import { toast } from 'sonner';
import { Building2, ShieldCheck, Landmark } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function GovtLoginPage() {
    const navigate = useNavigate();
    const { refreshData, setAuth } = useEntity();

    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [serviceId, setServiceId] = useState('');
    const [password, setPassword] = useState('');
    const [serviceName, setServiceName] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const deviceInfo = {
                device: 'Desktop', // Simplified for now, or use detectDevice util
                browser: 'Chrome',
                os: 'Windows',
                ip: '127.0.0.1'
            };

            const res = await apiService.auth.loginGov(serviceId, password, deviceInfo);
            if (res.success && res.token) {
                setAuth(res.token); // Updates Context + LocalStorage
                await refreshData();
                // Ensure state update propagates before navigation
                setTimeout(() => {
                    navigate('/govt/approvals');
                }, 100);
            } else {
                toast.error(res.error || "Invalid Credentials");
            }
        } catch (error) {
            toast.error("Login failed. Check connection.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await apiService.auth.registerGov(serviceId, password, serviceName);
            if (res.success) {
                toast.success("Service Registered! Please login.");
                setIsRegistering(false);
                setPassword('');
            } else {
                toast.error(res.error || "Registration failed");
            }
        } catch (error) {
            toast.error("Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden transition-colors duration-300">
            {/* Theme Toggle */}
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle />
            </div>

            {/* Background Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50 via-background to-blue-100/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20"></div>

            <Card className="w-full max-w-md relative z-10 border-border bg-card/50 backdrop-blur-xl shadow-2xl">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-2 border border-primary/20">
                        <Landmark className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                        {isRegistering ? 'Govt Application Portal' : 'Official Government Login'}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {isRegistering
                            ? 'Register a new public service entity.'
                            : 'Secure access for authorized government services.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="serviceId">Service ID</Label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="serviceId"
                                    placeholder="e.g. GOV-HEALTH-01"
                                    className="pl-10"
                                    value={serviceId}
                                    onChange={e => setServiceId(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {isRegistering && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 fade-in">
                                <Label htmlFor="serviceName">Service Name</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="serviceName"
                                        placeholder="e.g. Ministry of Health"
                                        className="pl-10"
                                        value={serviceName}
                                        onChange={e => setServiceName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : (isRegistering ? 'Register Service' : 'Secure Login')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 text-center text-sm">
                    <button
                        type="button"
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-primary hover:underline underline-offset-4"
                    >
                        {isRegistering ? 'Already have a Service ID? Login' : 'Register new Government Service'}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Return to Citizen Login
                    </button>
                </CardFooter>
            </Card>
        </div>
    );
}
