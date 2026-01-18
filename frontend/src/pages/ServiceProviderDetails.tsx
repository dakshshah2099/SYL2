
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiService } from "@/services/apiService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Globe, ShieldCheck, Mail, Building2, Calendar, Lock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ServiceDetails {
    id: string;
    name: string;
    description: string;
    category: string;
    verified: boolean;
    contactEmail?: string;
    website?: string;
    isGovernmentService?: boolean;
    createdAt: string;
    entity: {
        id: string;
        type: string;
    };
}

export function ServiceProviderDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [service, setService] = useState<ServiceDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        loadService();
    }, [id]);

    const loadService = async () => {
        try {
            const res = await apiService.services.getById(id!);
            if (res && res.error) {
                toast.error(res.error);
                navigate('/services');
                return;
            }
            setService(res);
        } catch (e) {
            toast.error("Failed to load service details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!service) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Button variant="ghost" className="pl-0 gap-2" onClick={() => navigate('/services')}>
                <ArrowLeft className="h-4 w-4" />
                Back to Directory
            </Button>

            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="uppercase tracking-wider text-xs">
                            {service.category}
                        </Badge>
                        {service.verified && !service.isGovernmentService && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 gap-1">
                                <ShieldCheck className="h-3 w-3" />
                                Verified
                            </Badge>
                        )}
                        {service.isGovernmentService && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1">
                                <Building2 className="h-3 w-3" />
                                Govt Service
                            </Badge>
                        )}
                    </div>
                </div>
                {service.website && (
                    <Button variant="outline" className="gap-2" asChild>
                        <a href={service.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-4 w-4" />
                            Visit Website
                        </a>
                    </Button>
                )}
            </div>

            <Card className="bg-card">
                <CardHeader>
                    <CardTitle>About this Service</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                        {service.description}
                    </p>

                    <div className="grid gap-4 md:grid-cols-2 pt-4">
                        <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Official Website
                            </h4>
                            <div className="text-sm space-y-1">
                                <p className="text-muted-foreground">Visit Portal</p>
                                {service.website ? (
                                    <a href={service.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline block truncate">
                                        {service.website}
                                    </a>
                                ) : (
                                    <p className="font-medium">Not Available</p>
                                )}
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Registration Details
                            </h4>
                            <div className="text-sm space-y-1">
                                <p className="text-muted-foreground">Member Since</p>
                                <p className="font-medium">{new Date(service.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {service.isGovernmentService && (
                <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-500">
                            <Lock className="h-5 w-5" />
                            Government Mandated Access
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                            This service is operated by a government entity and has perpetual access to specific data points required for public welfare administration.
                            Consent management for this service is handled via the Government Mandate framework.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
