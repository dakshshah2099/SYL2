import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEntity } from "@/context/EntityContext";
import { Consent } from "@/types";
import { apiService } from "@/services/apiService";
import { toast } from "sonner";

function calculateDaysRemaining(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

const INDIVIDUAL_ATTRIBUTES = [
  "Name", "Date of Birth", "Address", "Phone Number", "Email",
  "Employment Status", "Income Range", "Credit Score", "Health Records",
  "Education History", "Criminal Record"
];

const ORG_ATTRIBUTES = [
  "Company Name", "Registration Number", "Tax ID (GSTIN/PAN)",
  "Business Address", "Board of Directors", "Annual Revenue",
  "Compliance Status", "Shareholding Pattern", "Audit Reports"
];

export function ConsentCenter() {
  const { currentEntity, refreshData } = useEntity();
  const [expandedConsent, setExpandedConsent] = useState<string | null>(null);

  // Pending Requests State
  const [pendingConsents, setPendingConsents] = useState<Consent[]>([]);
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  // Simulator State
  const [targetPhone, setTargetPhone] = useState("");
  const [targetType, setTargetType] = useState<"INDIVIDUAL" | "ORG">("INDIVIDUAL");
  const [simPurpose, setSimPurpose] = useState("Credit Score Verification");
  const [simAttributes, setSimAttributes] = useState<string[]>([]);

  // Set default attributes when target type changes
  useEffect(() => {
    setSimAttributes(targetType === 'INDIVIDUAL' ? ["Name", "Address"] : ["Company Name", "Registration Number"]);
  }, [targetType]);

  const activeAttributeList = targetType === 'INDIVIDUAL' ? INDIVIDUAL_ATTRIBUTES : ORG_ATTRIBUTES;

  const toggleSimAttribute = (attr: string) => {
    setSimAttributes(prev =>
      prev.includes(attr)
        ? prev.filter(a => a !== attr)
        : [...prev, attr]
    );
  };

  // Load Consents from Entity
  const consents = currentEntity?.consents || [];

  // Filter active consents
  const activeConsents = consents.filter(c => c.status !== 'revoked');

  useEffect(() => {
    if (currentEntity?.id) {
      loadPending();
    }
  }, [currentEntity?.id]);

  const loadPending = async () => {
    if (!currentEntity) return;
    try {
      const res = await apiService.entities.getPendingConsents(currentEntity.id);
      if (Array.isArray(res)) {
        setPendingConsents(res);
      }
    } catch (e) {
      console.error("Failed to load pending consents", e);
    }
  };



  const handleSimulateRequest = async () => {
    if (!currentEntity) return;
    if (simAttributes.length === 0) {
      toast.error("Please select at least one attribute");
      return;
    }

    try {
      await apiService.entities.requestConsent({
        targetUserId: targetPhone,
        requesterId: currentEntity.id,
        purpose: simPurpose,
        attributes: simAttributes,
        serviceName: currentEntity.name
      });
      toast.success("Request sent successfully!");
      setSimulatorOpen(false);
      setSimAttributes(["Name", "Address"]); // Reset to defaults
    } catch (e) {
      toast.error("Failed to send request");
    }
  };



  const handleRespond = async (consentId: string, action: 'approve' | 'reject', attributes?: string[], duration?: number) => {
    try {
      await apiService.entities.respondConsent(consentId, action, attributes, duration);
      toast.success(action === 'approve' ? "Consent Granted" : "Request Rejected");
      loadPending();
      refreshData(); // Refresh active consents
    } catch (e) {
      toast.error("Failed to respond");
    }
  };

  const handleRevoke = async (consentId: string) => {
    try {
      await apiService.entities.revokeConsent(consentId);
      toast.success("Access revoked successfully");
      refreshData();
    } catch (e) {
      toast.error("Failed to revoke access");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="page-header">Consent Center</h1>
          <p className="page-description">
            Manage data access permissions for <strong>{currentEntity?.name}</strong>.
          </p>
        </div>
        {currentEntity?.type !== 'INDIVIDUAL' && (
          <Button variant="outline" onClick={() => setSimulatorOpen(!simulatorOpen)}>
            {simulatorOpen ? 'Close Simulator' : 'Simulate Request'}
          </Button>
        )}
      </div>

      {simulatorOpen && (
        <div className="mb-8 p-4 border border-dashed border-primary/50 bg-primary/5 rounded-lg space-y-4">
          <h3 className="font-semibold text-primary">Request Simulator (Org/Govt View)</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Type</label>
              <div className="flex bg-muted p-1 rounded-md">
                <button
                  className={`flex-1 text-xs font-medium py-1.5 rounded-sm transition-all ${targetType === 'INDIVIDUAL' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setTargetType('INDIVIDUAL')}
                >
                  Individual
                </button>
                <button
                  className={`flex-1 text-xs font-medium py-1.5 rounded-sm transition-all ${targetType === 'ORG' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setTargetType('ORG')}
                >
                  Organization
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target ID</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={targetType === 'INDIVIDUAL' ? "+91... or UUID" : "Organization Entity ID"}
                value={targetPhone}
                onChange={e => setTargetPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Purpose</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={simPurpose}
                onChange={e => setSimPurpose(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium">Requested Data Attributes ({targetType === 'INDIVIDUAL' ? 'Personal' : 'Business'})</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeAttributeList.map(attr => (
                <div key={attr} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sim-${attr}`}
                    checked={simAttributes.includes(attr)}
                    onCheckedChange={() => toggleSimAttribute(attr)}
                  />
                  <label
                    htmlFor={`sim-${attr}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {attr}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSimulateRequest} disabled={!targetPhone || simAttributes.length === 0} className="mt-4">
            Send Data Request
          </Button>
        </div>
      )}

      {/* REQUESTER DASHBOARD (For Org/Govt) */}
      {currentEntity?.type !== 'INDIVIDUAL' && currentEntity?.id && (
        <RequesterDashboard entityId={currentEntity.id} />
      )}

      {/* Pending Requests - For INDIVIDUALS and ORGANIZATIONS */}
      {(currentEntity?.type === 'INDIVIDUAL' || currentEntity?.type === 'ORG') && pendingConsents.length > 0 && (
        <div className="section-card mb-6 border-l-4 border-l-warning">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
            </span>
            Pending Requests
          </h2>
          <div className="space-y-4">
            {pendingConsents.map(req => (
              <PendingRequestCard key={req.id} request={req} onRespond={handleRespond} />
            ))}
          </div>
        </div>
      )}

      {(currentEntity?.type === 'INDIVIDUAL' || currentEntity?.type === 'ORG') && (
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Services may request access, but only you can approve or deny. No data is shared by default.
        </p>
      )}

      {/* Consent Lifecycle Indicator - For INDIVIDUALS and ORGS */}
      {(currentEntity?.type === 'INDIVIDUAL' || currentEntity?.type === 'ORG') && (
        <div className="section-card mb-6">
          <p className="text-sm font-medium text-foreground mb-3">Consent Lifecycle</p>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-2 py-1 rounded bg-muted text-muted-foreground">Requested</span>
            <span className="text-muted-foreground">→</span>
            <span className="px-2 py-1 rounded bg-primary/10 text-primary">Approved</span>
            <span className="text-muted-foreground">→</span>
            <span className="px-2 py-1 rounded bg-success/10 text-success">Active</span>
            <span className="text-muted-foreground">→</span>
            <span className="px-2 py-1 rounded bg-warning/10 text-warning">Expiring</span>
            <span className="text-muted-foreground">→</span>
            <span className="px-2 py-1 rounded bg-destructive/10 text-destructive">Revoked</span>
          </div>
        </div>
      )}

      {/* Active Consents - For INDIVIDUALS and ORGS */}
      {(currentEntity?.type === 'INDIVIDUAL' || currentEntity?.type === 'ORG') && (
        <div className="section-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Active Consents</h2>

          {activeConsents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No active consents. Your data is not shared with any service.
            </p>
          ) : (
            <div className="space-y-4">
              {activeConsents.map((consent) => {
                const daysRemaining = calculateDaysRemaining(consent.expiresOn || new Date().toISOString());
                const isExpanded = expandedConsent === consent.id;

                return (
                  <div
                    key={consent.id}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedConsent(isExpanded ? null : consent.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">
                              {consent.serviceName}
                            </p>
                            {consent.verified && (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            )}
                            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              {consent.entityType}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {consent.attributes.length} attributes shared
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={
                            daysRemaining <= 7 ? "text-warning font-medium text-sm" : "text-muted-foreground text-sm"
                          }
                        >
                          {daysRemaining} days left
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border pt-4 bg-muted/30">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Purpose</p>
                            <p className="text-sm font-medium text-foreground mt-1">
                              {consent.purpose}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="text-sm font-medium text-foreground mt-1">
                              {consent.grantedOn || 'N/A'} → {consent.expiresOn || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            Shared Attributes
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {consent.attributes.map((attr) => (
                              <StatusBadge key={attr} status="shared">
                                {attr}
                              </StatusBadge>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevoke(consent.id);
                            }}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Revoke Access Immediately
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sub-component for Pending Request
function PendingRequestCard({ request, onRespond }: { request: Consent, onRespond: any }) {
  // Determine initial selected attributes.
  // If request.attributes is an array of strings, use it.
  const initialAttrs = Array.isArray(request.attributes) ? request.attributes as string[] : [];
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>(initialAttrs);
  const [duration, setDuration] = useState(90); // Default 90 days

  const toggleAttr = (attr: string) => {
    if (selectedAttributes.includes(attr)) {
      setSelectedAttributes(selectedAttributes.filter(a => a !== attr));
    } else {
      setSelectedAttributes([...selectedAttributes, attr]);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg">{request.serviceName}</h3>
          <p className="text-sm text-muted-foreground">Request ID: {request.id}</p>
        </div>
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
          New Request
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium mb-1">Purpose of Request:</p>
        <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md italic">
          "{request.purpose}"
        </p>
      </div>

      <div className="mb-6">
        <p className="text-sm font-medium mb-2">Requested Information (Uncheck to withhold):</p>
        <div className="grid grid-cols-2 gap-2">
          {initialAttrs.map((attr: string) => (
            <label key={attr} className="flex items-center space-x-2 border p-2 rounded cursor-pointer hover:bg-muted/50">
              <input
                type="checkbox"
                checked={selectedAttributes.includes(attr)}
                onChange={() => toggleAttr(attr)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm">{attr}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Consent Duration:</label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
        >
          <option value={1}>1 Day (Temporary)</option>
          <option value={7}>7 Days (Short Term)</option>
          <option value={30}>30 Days (Month)</option>
          <option value={90}>90 Days (Default)</option>
          <option value={180}>6 Months</option>
          <option value={365}>1 Year</option>
          <option value={3650}>Forever (10 Years)</option>
        </select>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button variant="outline" onClick={() => onRespond(request.id, 'reject')}>
          Reject Request
        </Button>
        <Button onClick={() => onRespond(request.id, 'approve', selectedAttributes, duration)} disabled={selectedAttributes.length === 0}>
          Approve Selected
        </Button>
      </div>
    </div>
  );
}

function RequesterDashboard({ entityId }: { entityId: string }) {
  const [grantedConsents, setGrantedConsents] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadOutbound();
  }, [entityId]);

  const loadOutbound = async () => {
    try {
      const res = await apiService.entities.getOutboundConsents(entityId);
      if (Array.isArray(res)) setGrantedConsents(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // Log access when data is viewed
      try {
        await apiService.entities.logDataAccess(id);
      } catch (e) {
        console.error("Failed to log access", e);
      }
    }
  };

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-xl font-bold border-b pb-2">Access Granted to You</h2>
      {grantedConsents.length === 0 ? (
        <p className="text-muted-foreground italic">You haven't been granted access to any user data yet.</p>
      ) : (
        <div className="grid gap-4">
          {grantedConsents.map(c => {
            const expiryDays = calculateDaysRemaining(c.expiresOn);
            const isExpanded = expandedId === c.id;
            const userDetails = c.entity.details || {};
            const allowedAttrs = c.attributes as string[];

            return (
              <div key={c.id} className="border rounded-lg bg-card overflow-hidden transition-all">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                  onClick={() => handleExpand(c.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {c.entity.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{c.entity.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {c.entity.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-medium text-success">Active Access</p>
                      <p className="text-xs text-muted-foreground">{expiryDays} days left</p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t bg-muted/20">
                    <h4 className="text-sm font-medium mb-3">Allowed Data Fields:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {allowedAttrs.map(attr => {
                        // Mock Data Matcher: Try to find the key in details
                        // In a real app, 'attr' would map to specific schema keys.
                        // Here we try to fuzzy match or just show the 'details' if it looks relevant.
                        // Construct a simple lookup:
                        // Name -> details.name
                        // Address -> details.address
                        // For demo, we just dump 'details' values if the key matches roughly, 
                        // or show "Verified" placeholder.

                        // Simple approach: Display the attribute name, and IF we have a matching key in details, show it.
                        // Convert attr to key logic (e.g. "Date of Birth" -> "dob", "dateOfBirth")

                        let value = "Not populated in profile";

                        // Common mock data filling for demo purposes if details is empty
                        if (attr === 'Name') value = c.entity.name;
                        else if (attr === 'Address') value = userDetails.address || "123 Random St, Cyber City";
                        else if (attr.includes('Birth')) value = userDetails.dob || "01/01/1990";
                        else if (attr.includes('Employment')) value = userDetails.employment || "Software Engineer";
                        else if (attr.includes('Credit')) value = "750 (Excellent)";
                        else if (userDetails[attr.toLowerCase()]) value = userDetails[attr.toLowerCase()];

                        return (
                          <div key={attr} className="flex flex-col p-2 bg-background border rounded">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">{attr}</span>
                            <span className="font-mono text-sm mt-1">{value}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground flex gap-1 items-center">
                      <Shield className="h-3 w-3" />
                      Data verified by Government Trust Network.
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
