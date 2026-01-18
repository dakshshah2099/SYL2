import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation, useNavigationType, NavigationType } from 'react-router-dom';
import { Entity, UserSession as Session, UserSettings, UserSecurityStats } from '../types';
import { apiService } from '../services/apiService';
import { detectDevice } from '../utils/deviceDetector';

interface EntityContextType {
    currentEntity: Entity | null;
    availableEntities: Entity[];
    isAuthenticated: boolean;
    switchEntity: (entityId: string) => void;
    login: (phone?: string, password?: string, email?: string) => Promise<{ success: boolean; error?: string; token?: string }>;
    verifyOtp: (code: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;

    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;

    sessions: Session[];
    terminateSession: (sessionId: string) => void;
    currentSession: Session | null;
    refreshData: () => Promise<void>;
    securityStats: UserSecurityStats | null;
    updateSettings: (settings: any) => Promise<void>;
    terminateAllSessions: () => Promise<void>;
    setAuth: (token: string) => void;
}

const EntityContext = createContext<EntityContextType>({
    isAuthenticated: false,
    availableEntities: [], // Corrected from 'entities' to 'availableEntities'
    currentEntity: null,
    switchEntity: () => { }, // Added missing switchEntity
    login: async () => ({ success: false }), // Corrected return type for login
    verifyOtp: async () => ({ success: false }), // Corrected return type for verifyOtp
    logout: () => { },
    theme: 'dark',
    setTheme: () => { },
    sessions: [],
    currentSession: null,
    terminateSession: async () => { },
    refreshData: async () => { },
    securityStats: null,
    updateSettings: async () => { },
    terminateAllSessions: async () => { },
    setAuth: () => { }
});

export const EntityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // 1. Auth Persistence
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        // Check for Kill Switch (from ProfileSetupPage refresh/exit)
        // If 'profile_setup_pending' exists, it means user reloaded ON the setup page or crashed out.
        if (sessionStorage.getItem('profile_setup_pending')) {
            localStorage.removeItem('trustid_auth_token');
            sessionStorage.removeItem('profile_setup_pending');
            return false;
        }
        return !!localStorage.getItem('trustid_auth_token');
    });

    // 2. Data State
    const [availableEntities, setAvailableEntities] = useState<Entity[]>([]);
    const [currentEntity, setCurrentEntity] = useState<Entity | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [securityStats, setSecurityStats] = useState<UserSecurityStats | null>(null);

    const [theme, setTheme] = useState<UserSettings['theme']>('system');

    // Auth State
    const [tempAuth, setTempAuth] = useState<{ phone: string; verified: boolean }>({ phone: '', verified: false });

    const [currentSession, setCurrentSession] = useState<Session | null>(null);

    const setAuth = (token: string) => {
        localStorage.setItem('trustid_auth_token', token);
        setIsAuthenticated(true);
    };

    const refreshData = async () => {
        try {
            // Remove closure check, rely on localStorage token presence
            // if (!isAuthenticated) return;
            const entities = await apiService.entities.getAll();

            if (entities && entities.error) {
                console.warn("[Entity] Fetch failed:", entities.error);
                // Only logout if 401/403 specifically, but for now let's just not force logout 
                // to allow debugging and manual retry if it's network flake.
                if (entities.error === 'Invalid token' || entities.error === 'Session expired or invalidated') {
                    localStorage.setItem('session_terminated', 'true');
                    logout();
                }
                return;
            }

            if (!Array.isArray(entities)) {
                console.error("[Entity] Expected array but got:", entities);
                return;
            }

            setAvailableEntities(entities);
            setAvailableEntities(entities);

            // Restore persistence or default
            const lastEntityId = localStorage.getItem('last_entity_id');
            const persistedEntity = lastEntityId ? entities.find(e => e.id === lastEntityId) : null;

            // Priority: Existing State > Persisted ID > First Available
            if (currentEntity && entities.find(e => e.id === currentEntity.id)) {
                // Refresh data for current
                const updated = entities.find(e => e.id === currentEntity.id);
                if (updated) setCurrentEntity(updated);
            } else if (persistedEntity) {
                setCurrentEntity(persistedEntity);
            } else if (entities.length > 0) {
                setCurrentEntity(entities[0]);
            }
            // else: no entities found (shouldn't happen for logged in user)

            const sessionsData = await apiService.entities.getSessions();

            // Check if request failed (likely auth error 401/403)
            // apiService returns { error: '...' } on failure
            if (sessionsData && sessionsData.error) {
                console.warn("[Session] Session check failed:", sessionsData.error);
                if (sessionsData.error === 'Invalid token' || sessionsData.error === 'Session expired or invalidated') {
                    localStorage.setItem('session_terminated', 'true');
                    logout();
                }
                return;
            }

            setSessions(Array.isArray(sessionsData) ? sessionsData : []);

            // Get Security Stats
            const stats = await apiService.auth.getUserSecurity();
            if (stats && !stats.error) {
                setSecurityStats(stats);
            }
        } catch (e) {
            console.error("Failed to refresh data", e);
            // On network error we might not want to logout immediately to avoid flickering on flaky connections,
            // but for security "fail closed" might be better. 
            // For now, only logout on explicit API error response.
        }
    };

    // Initial Load
    useEffect(() => {
        if (isAuthenticated) {
            refreshData();
        }
    }, [isAuthenticated]);

    // Check for incomplete profile
    useEffect(() => {
        if (isAuthenticated && currentEntity && !currentEntity.verified) {
            const isOrg = currentEntity.type === 'ORG';
            const targetPath = isOrg ? '/org-setup' : '/profile-setup';

            // Avoid redirect loop if already there
            if (location.pathname !== targetPath) {
                navigate(targetPath);
            }
        }
    }, [isAuthenticated, currentEntity, location.pathname, navigate]);

    // Device Detection (just for current session display in context, actual creation is via API)
    useEffect(() => {
        const deviceInfo = detectDevice();
        setCurrentSession({
            id: 'current',
            device: `${deviceInfo.browser} on ${deviceInfo.os}`,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            location: "Detected (Local)",
            ip: "127.0.0.1",
            lastActive: "Now",
            current: true
        });
    }, []);

    // Theme Effect
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
    }, [theme]);

    // ------------------------------------------------------------------
    // SECURITY KILL SWITCH (User Requested: Refresh/Back = Logout)
    // ------------------------------------------------------------------
    // ------------------------------------------------------------------
    // SECURITY KILL SWITCH (User Requested: Refresh/Back = Logout)
    // ------------------------------------------------------------------

    // 1. Browser Refresh/Close Guard
    useEffect(() => {
        // Check for prior security logout
        if (sessionStorage.getItem('security_logout')) {
            toast.error("Session terminated for security.", {
                description: "Refreshing or navigating away logs you out automatically."
            });
            sessionStorage.removeItem('security_logout');
        }

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (localStorage.getItem('trustid_auth_token')) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        const handlePageHide = () => {
            if (localStorage.getItem('trustid_auth_token')) {
                localStorage.removeItem('trustid_auth_token');
                sessionStorage.setItem('security_logout', 'true');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, []);

    // 2. SPA Navigation Guard (Back/Forward Button)
    const navType = useNavigationType();
    const isFirstRun = useRef(true);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        // Only trigger on POP (Back/Forward) and if authenticated
        // PUSH/REPLACE are usually internal programmatic navigations (safe)
        if (navType === NavigationType.Pop && isAuthenticated) {
            const confirmLogout = window.confirm("Security Alert: Navigating back/forward will terminate your session. Do you want to proceed?");

            if (confirmLogout) {
                logout();
                toast.error("Logged out for security.");
            } else {
                // Revert the back action by going forward again
                // This is a bit of a hack but effective for pure client-side blocking without Data Router
                navigate(1);
            }
        }
    }, [location.pathname, navType]); // Check on path change


    const switchEntity = (entityId: string) => {
        const entity = availableEntities.find(e => e.id === entityId);
        if (entity) {
            setCurrentEntity(entity);
            localStorage.setItem('last_entity_id', entity.id);
            // If switching to a valid entity, we might want to go to dashboard
            if (entity.verified) {
                navigate('/');
            }
        }
    };

    const login = async (phone?: string, password?: string, email?: string) => {
        try {
            const res = await apiService.auth.login(phone, password, email);
            if (res.success) {
                if (res.token) {
                    // Direct Org Login (no OTP)
                    setIsAuthenticated(true);
                    localStorage.setItem('trustid_auth_token', res.token);
                    await refreshData();
                    return { success: true, token: res.token };
                }
                // Individual Step 1 (OTP sent)
                if (phone) setTempAuth({ phone, verified: false });
                return { success: true };
            }
            return { success: false, error: res.error || "Invalid credentials" };
        } catch (e) {
            return { success: false, error: "Network error" };
        }
    };

    const verifyOtp = async (code: string) => {
        try {
            const deviceInfo = detectDevice();
            // Pass device info to backend to create session
            const res = await apiService.auth.verifyOtp(tempAuth.phone, code, {
                device: `${deviceInfo.browser} on ${deviceInfo.os}`,
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                ip: '127.0.0.1'
            });

            if (res.success) {
                setIsAuthenticated(true);
                localStorage.setItem('trustid_auth_token', res.token);
                setTempAuth(prev => ({ ...prev, verified: true }));

                // Refresh data immediately with the new token
                await refreshData();

                return { success: true };
            }
            return { success: false, error: res.error || "Invalid OTP" };
        } catch (e) {
            return { success: false, error: "Verification failed" };
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        setIsAuthenticated(false);
        localStorage.removeItem('trustid_auth_token');
        localStorage.removeItem('last_entity_id');
        setTempAuth({ phone: '', verified: false });
        setCurrentEntity(null);
        setSessions([]);
        setAvailableEntities([]);
        navigate('/login');
    };

    const terminateSession = async (sessionId: string) => {
        const toastId = toast.loading("Terminating session...");
        try {
            const res = await apiService.entities.terminateSession(sessionId);
            if (res.error) throw new Error(res.error);

            toast.success("Session terminated", { id: toastId });
        } catch (e: any) {
            console.error("Failed to terminate session on backend", e);
            toast.error(e.message || "Failed to terminate session", { id: toastId });
            return; // Don't logout if failed
        }

        // 2. Determine if it was the current session
        const sessionInList = sessions.find(s => s.id === sessionId);
        const isCurrent = sessionInList ? sessionInList.current : (currentSession && sessionId === currentSession.id);

        // 3. Logout locally OR Refresh List
        if (isCurrent) {
            localStorage.setItem('session_terminated', 'true');
            logout();
        } else {
            refreshData();
        }
    };

    const terminateAllSessions = async () => {
        const toastId = toast.loading("Terminating all other sessions...");
        try {
            const res = await apiService.entities.terminateAllOthers();
            if (res.error) throw new Error(res.error);

            toast.success("All other sessions terminated", { id: toastId });
            refreshData();
        } catch (e: any) {
            console.error("Failed to terminate sessions", e);
            toast.error(e.message || "Failed to terminate sessions", { id: toastId });
        }
    };

    return (
        <EntityContext.Provider value={{
            currentEntity,
            availableEntities,
            isAuthenticated,
            switchEntity,
            login,
            verifyOtp,
            logout,
            theme,
            setTheme,
            sessions,
            currentSession,
            terminateSession,
            refreshData,
            securityStats,
            updateSettings: async (settings: any) => {
                if (settings.theme) setTheme(settings.theme);
                await apiService.entities.updateSettings(settings);
            },
            terminateAllSessions,
            setAuth
        }}>
            {children}
        </EntityContext.Provider >
    );
};

export const useEntity = () => {
    const context = useContext(EntityContext);
    if (context === undefined) {
        throw new Error('useEntity must be used within an EntityProvider');
    }
    return context;
};
