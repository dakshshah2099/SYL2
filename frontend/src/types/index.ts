export type EntityType = 'INDIVIDUAL' | 'ORG' | 'GOVT';

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  verified: boolean;
  avatar?: string;
  // Org specific
  registrationNumber?: string;
  jurisdiction?: string;
  // Individual specific
  dob?: string;
  // Relations
  details?: any;
  consents?: Consent[];
  alerts?: SecurityAlert[];
  accessLogs?: AccessLogEntry[];
}

export interface Attribute {
  id: string;
  name: string;
  value: string;
  category: 'personal' | 'healthcare' | 'agriculture' | 'city' | 'financial' | 'legal';
  stored: boolean;
  shared: boolean;
  lastAccessed: string | null;
  visibility: 'private' | 'public' | 'protected';
}

export interface Consent {
  id: string;
  serviceName: string;
  entityType: 'Government' | 'Public Service' | 'Private' | 'Institution';
  verified: boolean;
  purpose: string;
  attributes: string[]; // List of attribute names or IDs
  grantedOn: string;
  expiresOn: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface ConsentRequest {
  id: string;
  serviceName: string;
  verified: boolean;
  purpose: string;
  requestedAttributes: {
    id: string;
    name: string;
    required: boolean;
  }[];
  requestedOn: string;
  durationOptions: string[];
}

export interface AccessLogEntry {
  id: string;
  service: string;
  entityType: 'Government' | 'Public Service' | 'Institution' | 'Private';
  attributes: string[];
  timestamp: string;
  purpose: string;
  status: 'approved' | 'denied' | 'expired' | 'revoked';
}

export interface SecurityAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

export interface UserSettings {
  defaultConsentDuration: string;
  autoDenyUnknownServices: boolean;
  notifyOnAccess: boolean;
  notifyOnNewDevice: boolean;
  notifyBeforeExpiry: boolean;
  twoFactorEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface UserSecurityStats {
  lastLogin: string | null;
  lastLoginLocation: string | null;
  failedLoginAttempts: number;
  lastFailedLogin: string | null;
  passwordChangedAt: string | null;
  settings?: {
    theme?: 'light' | 'dark' | 'system';
    [key: string]: any;
  };
}
