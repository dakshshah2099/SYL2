import { useState, useEffect } from "react";
import { Building, CheckCircle2, Clock, XCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiService } from "@/services/apiService";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export function GovtApprovalsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvalData, setApprovalData] = useState<any>(null); // For showing credentials
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const res = await apiService.govt.getOrgRequests();
            if (Array.isArray(res)) setRequests(res);
        } catch (e) {
            console.error("Failed to load requests", e);
            toast.error("Failed to fetch requests");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (req: any) => {
        try {
            const res = await apiService.govt.approveOrgRequest(req.id);
            if (res.success) {
                toast.success(`Approved ${req.name}`);
                setApprovalData({
                    name: req.name,
                    email: req.email,
                    password: res.credentials.password
                });
                loadRequests();
            } else {
                toast.error(res.error || "Approval failed");
            }
        } catch (e) {
            toast.error("Network error");
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm("Reject this request?")) return;
        try {
            const res = await apiService.govt.rejectOrgRequest(id);
            if (res.success) {
                toast.success("Request rejected");
                loadRequests();
            }
        } catch (e) {
            toast.error("Network error");
        }
    };

    const filteredRequests = requests.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.registrationNumber.includes(searchTerm) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Organization Approvals</h1>
                    <p className="text-muted-foreground">Review and approve registration requests from entities.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadRequests}>
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, reg no, or email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading Requests...</div>
            ) : filteredRequests.length === 0 ? (
                <div className="p-12 text-center border rounded-lg bg-muted/10">
                    <Building className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-medium">No Pending Requests</h3>
                    <p className="text-muted-foreground">All caught up!</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRequests.map(req => (
                        <div key={req.id} className="p-5 border rounded-lg bg-card shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg">{req.name}</h3>
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
                                            <Clock className="h-3 w-3" />
                                            {req.status.toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-muted-foreground mb-6">
                                    <div className="flex justify-between">
                                        <span>Reg No:</span>
                                        <span className="font-medium text-foreground">{req.registrationNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Jurisdiction:</span>
                                        <span className="font-medium text-foreground">{req.jurisdiction}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Email:</span>
                                        <span className="font-medium text-foreground truncate max-w-[150px]" title={req.email}>{req.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>City:</span>
                                        <span className="font-medium text-foreground">{req.address}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                <Button className="bg-success hover:bg-success/90 text-white" onClick={() => handleApprove(req)}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleReject(req.id)}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Credentials Dialog */}
            <Dialog open={!!approvalData} onOpenChange={(open) => !open && setApprovalData(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Organization Approved</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Alert className="bg-success/10 border-success/20">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <AlertDescription className="text-success-foreground">
                                Account created successfully.
                            </AlertDescription>
                        </Alert>
                        <div className="p-4 bg-muted rounded-md space-y-2 font-mono text-sm">
                            <p><span className="text-muted-foreground">Org:</span> {approvalData?.name}</p>
                            <p><span className="text-muted-foreground">Email:</span> {approvalData?.email}</p>
                            <p><span className="text-muted-foreground">Temporary Password:</span> <strong className="select-all block mt-1 bg-background p-2 rounded border">{approvalData?.password}</strong></p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Please share these credentials securely with the organization representative.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setApprovalData(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
