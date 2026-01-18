
import { useState, useEffect } from "react";
import { Building2, Search, Zap, Globe, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiService } from "@/services/apiService";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export function GovtOrganizations() {
    const [orgs, setOrgs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Promotion Dialog Status
    const [promoOrg, setPromoOrg] = useState<any>(null);
    const [email, setEmail] = useState("");
    const [promoting, setPromoting] = useState(false);

    useEffect(() => {
        loadOrgs();
    }, []);

    const loadOrgs = async () => {
        try {
            const res = await apiService.govt.getVerifiedOrgs();
            if (Array.isArray(res)) setOrgs(res);
        } catch (e) {
            toast.error("Failed to fetch organizations");
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async () => {
        if (!promoOrg) return;
        setPromoting(true);
        try {
            const res = await apiService.govt.promoteToService(promoOrg.id, email);
            if (res.success) {
                toast.success(`${promoOrg.name} is now a Government Service`);
                loadOrgs(); // Refresh list
                setPromoOrg(null);
                setEmail("");
            } else {
                toast.error(res.error || "Promotion failed");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setPromoting(false);
        }
    };

    const handleDemote = async (orgId: string) => {
        if (!confirm("Are you sure you want to remove the Government Service status? This will revoke special access privileges.")) return;
        setPromoting(true);
        try {
            const res = await apiService.govt.demoteFromService(orgId);
            if (res.success) {
                toast.success("Government Status Removed");
                loadOrgs();
            } else {
                toast.error(res.error || "Action failed");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setPromoting(false);
        }
    };

    const filteredOrgs = orgs.filter(o =>
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.registrationNumber && o.registrationNumber.includes(searchTerm))
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Verified Organizations</h1>
                    <p className="text-muted-foreground">Manage organizations and designate government services.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadOrgs}>Refresh</Button>
                </div>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredOrgs.length === 0 ? (
                <div className="p-12 text-center border rounded-lg bg-muted/10">
                    <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-medium">No Organizations Found</h3>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredOrgs.map(org => {
                        const isGovService = org.serviceProvider?.isGovernmentService;

                        return (
                            <div key={org.id} className="p-5 border rounded-lg bg-card shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-indigo-600" />
                                            <h3 className="font-bold text-lg">{org.name}</h3>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm text-muted-foreground mb-6">
                                        <div className="flex justify-between">
                                            <span>Reg No:</span>
                                            <span className="font-medium text-foreground">{org.registrationNumber || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Status:</span>
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                                <ShieldCheck className="h-3 w-3" />
                                                Verified
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t">
                                    {isGovService ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 p-2 bg-amber-50 rounded-md border border-amber-200 flex items-center justify-center gap-2 text-amber-700 text-sm font-medium">
                                                <Globe className="h-4 w-4" />
                                                Government Service
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                                                onClick={() => handleDemote(org.id)}
                                                disabled={promoting}
                                            >
                                                <Zap className="h-4 w-4 rotate-180" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                            onClick={() => setPromoOrg(org)}
                                        >
                                            <Zap className="mr-2 h-4 w-4" />
                                            Mark as Govt Service
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Promotion Dialog */}
            <Dialog open={!!promoOrg} onOpenChange={(open) => !open && setPromoOrg(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Promote to Government Service</DialogTitle>
                        <DialogDescription>
                            This will list <strong>{promoOrg?.name}</strong> in the Service Directory with a Government badge.
                            They will have perpetual access privileges.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Public Contact Email</label>
                            <Input
                                placeholder="e.g. support@nha.gov.in"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">This email will be displayed to citizens.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPromoOrg(null)}>Cancel</Button>
                        <Button onClick={handlePromote} disabled={promoting || !email}>
                            {promoting ? 'Promoting...' : 'Confirm Promotion'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
