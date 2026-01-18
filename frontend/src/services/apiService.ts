const PORTS = [3000, 3001, 3002, 3003, 3004, 3005];
let API_URL = '/api'; // Default for production (Relative path)

// Helper to check if a backend is alive
const checkHealth = async (port: number) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout

        const res = await fetch(`http://localhost:${port}/health`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return res.ok;
    } catch {
        return false;
    }
};

const getHeaders = () => {
    const token = localStorage.getItem('trustid_auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

export const apiService = {
    // Call this on app start
    initialize: async () => {
        // Only run localhost checks in Development
        if (import.meta.env.DEV) {
            API_URL = 'http://localhost:3000/api'; // Default Dev
            for (const port of PORTS) {
                if (await checkHealth(port)) {
                    API_URL = `http://localhost:${port}/api`;
                    console.log(`[API] Connected to backend on port ${port}`);
                    return;
                }
            }
            console.error("No backend found on ports 3000-3005");
        } else {
            console.log("[API] Production mode: Using relative /api path");
        }
    },

    auth: {
        async checkPhone(phone: string) {
            const res = await fetch(`${API_URL}/auth/check-phone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
            return res.json();
        },
        async checkEmail(email: string) {
            const res = await fetch(`${API_URL}/auth/check-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            return res.json();
        },
        async orgRequest(data: any) {
            const res = await fetch(`${API_URL}/auth/org-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return res.json();
        },
        async register(phone: string, password: string, type: 'INDIVIDUAL' | 'ORG' = 'INDIVIDUAL') {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password, type })
            });
            return res.json();
        },
        async login(phone?: string, password?: string, email?: string) {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password, email }),
            });
            return response.json();
        },
        verifyOtp: async (phone: string, otp: string, deviceInfo: any) => {
            const res = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ phone, otp, deviceInfo })
            });
            return res.json();
        },
        // NEW: Send OTP (Generic)
        sendOtp: async (data: { phone?: string, email?: string }) => {
            const res = await fetch(`${API_URL}/auth/send-otp`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return res.json();
        },
        registerGov: async (serviceId: string, password: string, serviceName: string) => {
            const res = await fetch(`${API_URL}/auth/register-gov`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceId, password, serviceName })
            });
            return res.json();
        },
        loginGov: async (serviceId: string, password: string, deviceInfo: any) => {
            const res = await fetch(`${API_URL}/auth/login-gov`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceId, password, deviceInfo })
            });
            return res.json();
        },
        getUserSecurity: async () => {
            const res = await fetch(`${API_URL}/auth/user-security`, { headers: getHeaders() });
            return res.json();
        },
        // NEW: Delete Account
        deleteAccount: async (password: string) => {
            const res = await fetch(`${API_URL}/auth/account`, {
                method: 'DELETE',
                headers: getHeaders(),
                body: JSON.stringify({ password })
            });
            return res.json();
        },
        // NEW: Change Password
        changePassword: async (oldPassword: string, newPassword: string) => {
            const res = await fetch(`${API_URL}/auth/password`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ oldPassword, newPassword })
            });
            return res.json();
        },
        // NEW: Reset Password (via OTP)
        resetPassword: async (phone: string, otp: string, newPassword: string, email?: string) => {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ phone, otp, newPassword, email })
            });
            return res.json();
        }
    },
    entities: {
        // NEW: Update User Settings
        updateSettings: async (settings: any) => {
            const res = await fetch(`${API_URL}/entities/settings`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(settings)
            });
            return res.json();
        },
        getAll: async () => {
            const res = await fetch(`${API_URL}/entities`, { headers: getHeaders() });
            return res.json();
        },
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/entities`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return res.json();
        },
        update: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/entities/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return res.json();
        },
        getSessions: async () => {
            const res = await fetch(`${API_URL}/entities/sessions`, { headers: getHeaders() });
            return res.json();
        },
        terminateSession: async (sessionId: string) => {
            const res = await fetch(`${API_URL}/entities/sessions/${sessionId}/terminate`, {
                method: 'POST',
                headers: getHeaders()
            });
            return res.json();
        },
        terminateAllOthers: async () => {
            const res = await fetch(`${API_URL}/entities/sessions/terminate-all`, {
                method: 'POST',
                headers: getHeaders()
            });
            return res.json();
        },
        revokeConsent: async (consentId: string) => {
            const res = await fetch(`${API_URL}/entities/consents/${consentId}/revoke`, {
                method: 'POST',
                headers: getHeaders()
            });
            return res.json();
        },
        requestConsent: async (data: any) => {
            const res = await fetch(`${API_URL}/entities/consents/request`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return res.json();
        },
        getPendingConsents: async (entityId: string) => {
            const res = await fetch(`${API_URL}/entities/${entityId}/consents/pending`, { headers: getHeaders() });
            return res.json();
        },
        async getOutboundConsents(entityId: string) {
            const response = await fetch(`${API_URL}/entities/${entityId}/consents/outbound`, { headers: getHeaders() });
            return response.json();
        },
        async getAccessLogs() {
            const response = await fetch(`${API_URL}/entities/access-logs`, { headers: getHeaders() });
            return response.json();
        },
        async logDataAccess(consentId: string) {
            const response = await fetch(`${API_URL}/entities/consents/${consentId}/access`, {
                method: 'POST',
                headers: getHeaders()
            });
            return response.json();
        },
        respondConsent: async (consentId: string, action: 'approve' | 'reject', grantedAttributes?: string[], duration?: number) => {
            const res = await fetch(`${API_URL}/entities/consents/${consentId}/respond`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ action, grantedAttributes, duration })
            });
            return res.json();
        },
        dismissAlert: async (alertId: string) => {
            const res = await fetch(`${API_URL}/entities/alerts/${alertId}/dismiss`, {
                method: 'POST',
                headers: getHeaders()
            });
            return res.json();
        },
        acknowledgeAlert: async (alertId: string) => {
            const res = await fetch(`${API_URL}/entities/alerts/${alertId}/acknowledge`, {
                method: 'POST',
                headers: getHeaders()
            });
            return res.json();
        }
    },
    govt: {
        getOrgRequests: async () => {
            const res = await fetch(`${API_URL}/auth/govt/org-requests`, { headers: getHeaders() });
            return res.json();
        },
        approveOrgRequest: async (id: string) => {
            const res = await fetch(`${API_URL}/auth/govt/org-requests/${id}/approve`, {
                method: 'POST',
                headers: getHeaders()
            });
            return res.json();
        },
        rejectOrgRequest: async (id: string) => {
            const res = await fetch(`${API_URL}/auth/govt/org-requests/${id}/reject`, {
                method: 'POST',
                headers: getHeaders()
            });
            return res.json();
        },
        getVerifiedOrgs: async () => {
            const res = await fetch(`${API_URL}/auth/govt/organizations`, { headers: getHeaders() });
            return res.json();
        },
        promoteToService: async (entityId: string, email: string) => {
            const token = localStorage.getItem('trustid_auth_token');
            try {
                const res = await fetch(`${API_URL}/services/promote`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ entityId, contactEmail: email })
                });
                return await res.json();
            } catch (e) {
                return { success: false, error: 'Network error' };
            }
        },
        demoteFromService: async (entityId: string) => {
            const token = localStorage.getItem('trustid_auth_token');
            try {
                const res = await fetch(`${API_URL}/services/demote`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ entityId })
                });
                return await res.json();
            } catch (e) {
                return { success: false, error: 'Network error' };
            }
        }
    },
    services: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/services`, { headers: getHeaders() });
            return res.json();
        },
        getById: async (id: string) => {
            const res = await fetch(`${API_URL}/services/${id}`, { headers: getHeaders() });
            return res.json();
        },
        register: async (data: any) => {
            const res = await fetch(`${API_URL}/services`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return res.json();
        }
    },
    govAI: {
        chat: async (message: string) => {
            const res = await fetch(`${API_URL}/gov-ai/chat`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ message })
            });
            return res.json();
        }
    }
};
