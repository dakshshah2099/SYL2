
import { useState, useEffect } from "react";
import { Search, Building2, Stethoscope, Briefcase, Zap, Globe, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useEntity } from "@/context/EntityContext";
import { apiService } from "@/services/apiService";
import { toast } from "sonner";

interface ServiceProvider {
    id: string;
    name: string;
    description: string;
    category: string;
    icon?: string;
    verified: boolean;
    entity: { id: string; type: string };
    contactEmail?: string;
    website?: string;
    isGovernmentService?: boolean;
}

const CATEGORIES = [
    { id: "ALL", label: "All Services" },
    { id: "GOVT", label: "Government" },
    { id: "FINANCE", label: "Finance & Banking" },
    { id: "HEALTH", label: "Healthcare" },
    { id: "UTILITY", label: "Utilities" },
    { id: "OTHER", label: "Other" },
];

export function ServiceProviders() {
    const { currentEntity } = useEntity();
    const navigate = useNavigate();
    const [services, setServices] = useState<ServiceProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            const res = await apiService.services.getAll();
            if (Array.isArray(res)) setServices(res);
        } catch (e) {
            toast.error("Failed to load services");
        } finally {
            setLoading(false);
        }
    };

    const filteredServices = services.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'GOVT': return <Building2 className="h-5 w-5" />;
            case 'HEALTH': return <Stethoscope className="h-5 w-5" />;
            case 'FINANCE': return <Briefcase className="h-5 w-5" />;
            case 'UTILITY': return <Zap className="h-5 w-5" />;
            default: return <Globe className="h-5 w-5" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Service Directory</h1>
                    <p className="text-muted-foreground">Discover and manage access to verified service providers.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredServices.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-medium">No services found</h3>
                    <p className="text-muted-foreground">Try adjusting your search terms.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredServices.map((service) => (
                        <div
                            key={service.id}
                            className="group relative flex flex-col p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20 cursor-pointer"
                            onClick={() => navigate(`/services/${service.id}`)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                                    {getCategoryIcon(service.category)}
                                </div>
                                {service.verified && !service.isGovernmentService && (
                                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20 gap-1">
                                        <ShieldCheck className="h-3 w-3" />
                                        Verified
                                    </Badge>
                                )}
                                {service.isGovernmentService && (
                                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 gap-1">
                                        <Building2 className="h-3 w-3" />
                                        Govt Service
                                    </Badge>
                                )}
                            </div>

                            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                {service.name}
                            </h3>
                            <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-grow">
                                {service.description}
                            </p>

                            {/* Govt Mandated Website Display */}
                            {service.isGovernmentService && service.website && (
                                <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-md p-2 flex items-center gap-2">
                                    <Globe className="h-3.5 w-3.5 text-amber-600" />
                                    <a href={service.website} target="_blank" rel="noreferrer" className="text-xs font-medium text-amber-700 dark:text-amber-500 hover:underline truncate block max-w-full">
                                        {service.website}
                                    </a>
                                </div>
                            )}

                            <div className="pt-4 border-t border-border/50 mt-auto flex items-center justify-between">
                                <span className="text-xs text-muted-foreground font-medium px-2 py-1 bg-muted rounded-md uppercase tracking-wider">
                                    {service.category}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2 hover:bg-primary hover:text-primary-foreground group-visible"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent double click if card also clicks
                                        navigate(`/services/${service.id}`);
                                    }}
                                >
                                    View Details <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
