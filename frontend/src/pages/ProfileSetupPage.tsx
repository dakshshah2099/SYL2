import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Building, MapPin, Calendar, FileText, ArrowRight, Save, Shield } from "lucide-react";
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

export function ProfileSetupPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentEntity, refreshData, logout } = useEntity();
    const [isLoading, setIsLoading] = useState(false);
    const [isManualEntry, setIsManualEntry] = useState(false);

    // Atomic Creation Mode Check
    const createMode = location.state?.createMode || false;

    // Combine all form state
    const [formData, setFormData] = useState({
        fullName: "",
        dob: "",
        address: "",
        city: "",
        state: "",
        pincode: "",

        // Identity (Required)
        idType: "aadhar",
        idNumber: "",

        // Optional Fields
        occupation: "",
        employer: "",
        incomeRange: "",
        bloodGroup: "",
        allergies: "",
        bio: ""
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Pincode Lookup Logic
        if (field === 'pincode') {
            if (value.length < 6) setIsManualEntry(false); // Reset to auto mode on edit
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
                toast.error("Invalid Pincode. Please enter City/State manually.");
            }
        } catch (e) {
            console.error(e);
            setIsManualEntry(true);
            toast.error("Could not fetch address. Please enter manually.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Safety check: if not creating, we need existing entity
        if (!createMode && !currentEntity) return;

        setIsLoading(true);
        try {
            // Prepare details object & Filter empty values
            const cleanFormData = Object.fromEntries(
                Object.entries(formData).filter(([_, v]) => v !== undefined && v !== "" && v !== null)
            );

            const details = {
                ...cleanFormData,
                onboarded: true,
                onboardedAt: new Date().toISOString()
            };

            let result;

            if (createMode) {
                // ATOMIC CREATE
                result = await apiService.entities.create({
                    type: 'INDIVIDUAL',
                    name: formData.fullName,
                    details: details
                });
            } else {
                // UPDATE
                if (!currentEntity) return;
                result = await apiService.entities.update(currentEntity.id, {
                    name: formData.fullName,
                    details: details,
                    verified: true
                });
            }

            if (result && !result.success) {
                throw new Error(result.error || "Update failed");
            }

            await refreshData();
            toast.success("Profile setup complete!");

            if (result.entity) {
                localStorage.setItem('last_entity_id', result.entity.id);
            }
            navigate("/");
            window.location.reload();

        } catch (error: any) {
            console.error("Profile save error:", error);
            // Check for unique ID conflict (from backend 409)
            if (error.message && error.message.includes('Identity Document Number already registered')) {
                toast.error("This Identity ID is already linked to another profile!");
            } else {
                toast.error(error.message || "Failed to save profile");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h1>
                    <p className="text-muted-foreground">
                        To issue a verified digital identity, we need some additional information.
                        This data is encrypted and stored securely.
                    </p>
                </div>

                <div className="section-card">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Personal Info Section */}
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                <User className="h-5 w-5 text-primary" />
                                Personal Information
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        placeholder="As per official documents"
                                        value={formData.fullName}
                                        onChange={e => handleChange('fullName', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dob">Date of Birth</Label>
                                    <Input
                                        id="dob"
                                        type="date"
                                        value={formData.dob}
                                        onChange={e => handleChange('dob', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="pt-4 border-t border-border">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                <MapPin className="h-5 w-5 text-primary" />
                                Address Details
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="address">Street Address</Label>
                                    <Textarea
                                        id="address"
                                        placeholder="House no, Building, Street"
                                        value={formData.address}
                                        onChange={e => handleChange('address', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="pincode">Pincode</Label>
                                        <Input
                                            id="pincode"
                                            value={formData.pincode}
                                            onChange={e => handleChange('pincode', e.target.value)}
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={e => handleChange('city', e.target.value)}
                                            readOnly={!isManualEntry}
                                            className={!isManualEntry ? "bg-muted" : ""}
                                            placeholder={isManualEntry ? "Enter City" : "Auto-filled"}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State</Label>
                                        <Input
                                            id="state"
                                            value={formData.state}
                                            onChange={e => handleChange('state', e.target.value)}
                                            readOnly={!isManualEntry}
                                            className={!isManualEntry ? "bg-muted" : ""}
                                            placeholder={isManualEntry ? "Enter State" : "Auto-filled"}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Identity Proof */}
                        <div className="pt-4 border-t border-border">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                <Shield className="h-5 w-5 text-primary" />
                                Identity Verification
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="idType">ID Document Type</Label>
                                    <Select
                                        value={formData.idType}
                                        onValueChange={(val) => handleChange('idType', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select ID Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="aadhar">Aadhar Card</SelectItem>
                                            <SelectItem value="pan">PAN Card</SelectItem>
                                            <SelectItem value="driving">Driving License</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="idNumber">Document Number</Label>
                                    <Input
                                        id="idNumber"
                                        placeholder="XXXX-XXXX-XXXX"
                                        value={formData.idNumber}
                                        onChange={e => handleChange('idNumber', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Professional & Health (Optional) */}
                        <div className="pt-4 border-t border-border">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                <FileText className="h-5 w-5 text-primary" />
                                Additional Details (Optional)
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="occupation">Occupation</Label>
                                    <Input
                                        id="occupation"
                                        value={formData.occupation}
                                        onChange={e => handleChange('occupation', e.target.value)}
                                        placeholder="Current Job Title"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="employer">Employer / Organization</Label>
                                    <Input
                                        id="employer"
                                        value={formData.employer}
                                        onChange={e => handleChange('employer', e.target.value)}
                                        placeholder="Company Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bloodGroup">Blood Group</Label>
                                    <Select
                                        value={formData.bloodGroup}
                                        onValueChange={(val) => handleChange('bloodGroup', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Group" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="allergies">Allergies</Label>
                                    <Input
                                        id="allergies"
                                        value={formData.allergies}
                                        onChange={e => handleChange('allergies', e.target.value)}
                                        placeholder="e.g. Peanuts, Penicillin"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                                {isLoading ? "Saving Profile..." : "Complete Setup"}
                                {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                            </Button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
