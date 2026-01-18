import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Building2, MapPin, Globe, UserCheck, ShieldCheck, ArrowRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { apiService } from "@/services/apiService";
import { toast } from "sonner";
import { useEntity } from "@/context/EntityContext";

export function OrganizationSetupPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentEntity, refreshData } = useEntity();
    const [isLoading, setIsLoading] = useState(false);
    const [isManualEntry, setIsManualEntry] = useState(false);

    // creationMode: true if we are creating a fresh entity (from SignupPage)
    // false if we are editing an existing unverified entity (fallback)
    const createMode = location.state?.createMode || false;

    const [formData, setFormData] = useState({
        // Legal
        legalName: "",
        orgType: "llc",
        registrationNumber: "",
        dateOfIncorporation: "",

        // Address
        address: "",
        city: "",
        state: "",
        pincode: "",

        // Contact
        officialEmail: "",
        officialPhone: "",
        website: "",

        // Authorized Rep
        repName: "",
        repRole: "",
        repIdNumber: "",

        // Compliance
        taxId: "", // PAN/EIN
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (field === 'pincode') {
            if (value.length < 6) setIsManualEntry(false);
            if (value.length === 6) fetchCityState(value);
        }
    };

    const fetchCityState = async (pincode: string) => {
        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await response.json();
            if (data && data[0] && data[0].Status === 'Success') {
                const details = data[0].PostOffice[0];
                setFormData(prev => ({
                    ...prev,
                    city: details.District,
                    state: details.State
                }));
                setIsManualEntry(false);
                toast.success("Address details fetched!");
            } else {
                setIsManualEntry(true);
                toast.error("Invalid Pincode. Enter manually.");
            }
        } catch (e) {
            setIsManualEntry(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Safety: If not create mode, we need currentEntity
        if (!createMode && !currentEntity) return;

        setIsLoading(true);
        try {
            const cleanFormData = Object.fromEntries(
                Object.entries(formData).filter(([_, v]) => v !== undefined && v !== "" && v !== null)
            );

            const details = {
                ...cleanFormData,
                // Compliance Status (Mock)
                documentStatus: "Verified",
                onboarded: true,
                onboardedAt: new Date().toISOString()
            };

            let result;

            if (createMode) {
                // ATOMIC CREATE
                result = await apiService.entities.create({
                    type: 'ORG',
                    name: formData.legalName,
                    registrationNumber: formData.registrationNumber,
                    jurisdiction: formData.state || 'India',
                    details: details,
                });
            } else {
                // UPDATE EXISTING
                if (!currentEntity) return;
                result = await apiService.entities.update(currentEntity.id, {
                    name: formData.legalName,
                    registrationNumber: formData.registrationNumber,
                    jurisdiction: formData.state || 'India',
                    details: details,
                    verified: true
                });
            }

            if (result && !result.success) {
                throw new Error(result.error || "Setup failed");
            }

            // Success Logic
            toast.success("Organization setup complete!");

            // Refresh data to get the new/updated entity in the list
            await refreshData();

            // If we created a new one, we should ideally switch to it
            // But refreshData might not auto-switch if logic in context is strict.
            // Let's rely on user returning to dashboard or force logic
            if (result.entity) {
                // Manually set as last used so context picks it up after nav
                localStorage.setItem('last_entity_id', result.entity.id);
                // We can use switchEntity if it's in the list (refreshData usually awaits)
                // Assuming refreshData populates availableEntities
                // We navigate to home, and context should see 'last_entity_id' and pick it.
            }

            navigate("/");
            // Force reload to ensure clean slate context state if needed
            window.location.reload();

        } catch (error: any) {
            console.error("Org save error:", error);
            if (error.message && error.message.includes('unique')) {
                toast.error("Registration Number is already registered!");
            } else {
                toast.error(error.message || "Failed to save organization");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-3xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Register Organization</h1>
                    <p className="text-muted-foreground">
                        Establish your organization's digital identity on the TrustID network.
                    </p>
                </div>

                <div className="section-card">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* 1. Legal Identity */}
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                <Building2 className="h-5 w-5 text-primary" />
                                Legal Identity
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1 space-y-2">
                                    <Label htmlFor="legalName">Registered Name</Label>
                                    <Input
                                        id="legalName"
                                        value={formData.legalName}
                                        onChange={e => handleChange('legalName', e.target.value)}
                                        required
                                        placeholder="e.g. Acme Corp Pvt Ltd"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="orgType">Organization Type</Label>
                                    <Select value={formData.orgType} onValueChange={v => handleChange('orgType', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="llc">Private Limited (Pvt Ltd)</SelectItem>
                                            <SelectItem value="public">Public Limited</SelectItem>
                                            <SelectItem value="llp">LLP</SelectItem>
                                            <SelectItem value="ngo">NGO / Non-Profit</SelectItem>
                                            <SelectItem value="govt">Government Body</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="registrationNumber">Registration / CIN</Label>
                                    <Input
                                        id="registrationNumber"
                                        value={formData.registrationNumber}
                                        onChange={e => handleChange('registrationNumber', e.target.value)}
                                        required
                                        placeholder="Identification Number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dateOfIncorporation">Date of Incorporation</Label>
                                    <Input
                                        id="dateOfIncorporation"
                                        type="date"
                                        value={formData.dateOfIncorporation}
                                        onChange={e => handleChange('dateOfIncorporation', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Official Address */}
                        <div className="pt-4 border-t border-border">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                <MapPin className="h-5 w-5 text-primary" />
                                Official Address
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Registered Office Address</Label>
                                    <Textarea
                                        value={formData.address}
                                        onChange={e => handleChange('address', e.target.value)}
                                        required
                                        placeholder="Full address of headquarters"
                                    />
                                </div>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Pincode</Label>
                                        <Input
                                            value={formData.pincode}
                                            onChange={e => handleChange('pincode', e.target.value)}
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Input value={formData.city} readOnly={!isManualEntry} className={!isManualEntry ? "bg-muted" : ""} onChange={e => handleChange('city', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <Input value={formData.state} readOnly={!isManualEntry} className={!isManualEntry ? "bg-muted" : ""} onChange={e => handleChange('state', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Contact & Domain */}
                        <div className="pt-4 border-t border-border">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                <Globe className="h-5 w-5 text-primary" />
                                Contact & Domain
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="officialEmail">Official Email</Label>
                                    <Input
                                        id="officialEmail"
                                        type="email"
                                        value={formData.officialEmail}
                                        onChange={e => handleChange('officialEmail', e.target.value)}
                                        required
                                        placeholder="admin@company.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="officialPhone">Official Phone</Label>
                                    <Input
                                        id="officialPhone"
                                        type="tel"
                                        value={formData.officialPhone}
                                        onChange={e => handleChange('officialPhone', e.target.value)}
                                        required
                                        placeholder="+91..."
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="website">Website URL (Optional)</Label>
                                    <Input
                                        id="website"
                                        value={formData.website}
                                        onChange={e => handleChange('website', e.target.value)}
                                        placeholder="https://"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 4. Authorized Representative */}
                        <div className="pt-4 border-t border-border">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                <UserCheck className="h-5 w-5 text-primary" />
                                Authorized Representative
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={formData.repName}
                                        onChange={e => handleChange('repName', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role / Designation</Label>
                                    <Input
                                        value={formData.repRole}
                                        onChange={e => handleChange('repRole', e.target.value)}
                                        required
                                        placeholder="e.g. Director, CEO"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Govt ID Number (Representative)</Label>
                                    <Input
                                        value={formData.repIdNumber}
                                        onChange={e => handleChange('repIdNumber', e.target.value)}
                                        required
                                        placeholder="Aadhar / PAN of Signatory"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 5. Compliance & Documents */}
                        <div className="pt-4 border-t border-border">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                Compliance & Verification
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tax ID (PAN/EIN)</Label>
                                    <Input
                                        value={formData.taxId}
                                        onChange={e => handleChange('taxId', e.target.value)}
                                        required
                                        placeholder="Company PAN"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Proof of Registration</Label>
                                    <div className="border border-dashed border-input rounded-md p-4 flex flex-col items-center justify-center text-muted-foreground gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
                                        <Upload className="h-6 w-6" />
                                        <span className="text-xs">Upload Certificate (Mock)</span>
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div className="pt-6">
                            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                                {isLoading ? "Verifying & Saving..." : "Complete Organization Setup"}
                                {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
