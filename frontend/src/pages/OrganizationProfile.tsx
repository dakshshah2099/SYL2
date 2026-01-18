import { useState } from "react";
import { Building2, Shield, AlertTriangle, Trash2, Lock, FileKey } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useEntity } from "@/context/EntityContext";

export function OrganizationProfile() {
    const { currentEntity } = useEntity();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    if (!currentEntity || currentEntity.type !== 'ORG') {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h2 className="text-xl font-semibold">Restricted Area</h2>
                <p>This vault is only accessible to Organization entities.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-header flex items-center gap-2">
                        <Building2 className="h-8 w-8 text-primary" />
                        Organization Vault
                    </h1>
                    <p className="page-description">
                        Secure management of critical organization assets and lifecycle.
                    </p>
                </div>
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Vault Secure
                </div>
            </div>

            {/* Asset Management Stub */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="section-card h-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <FileKey className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold">Corporate Keys & Certs</h2>
                    </div>
                    <div className="p-4 border border-dashed rounded-lg bg-muted/50 text-center py-12">
                        <p className="text-muted-foreground">No active certificates found.</p>
                        <Button variant="outline" className="mt-4">Generate Keys</Button>
                    </div>
                </div>

                <div className="section-card h-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold">Compliance Status</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 border rounded-md">
                            <span className="text-sm font-medium">Registration</span>
                            <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">Verified</span>
                        </div>
                        <div className="flex justify-between items-center p-3 border rounded-md">
                            <span className="text-sm font-medium">Tax ID</span>
                            <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">Verified</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone - The Only Place to Delete Org */}
            <div className="section-card border-destructive/30 mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-destructive/10">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-destructive">Imminent Peril</h2>
                        <p className="text-sm text-muted-foreground">Irreversible actions regarding organization existence.</p>
                    </div>
                </div>

                <div className="p-6 border border-destructive/30 rounded-lg bg-destructive/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="font-bold text-foreground">Dissolve Organization</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Permanently delete this organization profile and all associated data.
                                <br />
                                <span className="font-semibold text-destructive">This action cannot be undone.</span>
                            </p>
                        </div>
                        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                            <DialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Dissolve Organization
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="border-destructive">
                                <DialogHeader>
                                    <DialogTitle className="text-destructive flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        Confirm Dissolution
                                    </DialogTitle>
                                    <DialogDescription>
                                        You are about to permanently delete <strong>{currentEntity.name}</strong>.
                                        This will immediately revoke all corporate credentials, employee access, and data sharing agreements.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md my-2">
                                    <strong>Warning:</strong> This action is recorded in the immutable audit log.
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                                        Abort
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            setShowDeleteDialog(false);
                                            // Handle Deletion Logic Here (Mock for now or reuse terminate logic if available)
                                            alert("Organization Dissolved (Mock)");
                                        }}
                                    >
                                        Confirm Dissolution
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </div>
    );
}
