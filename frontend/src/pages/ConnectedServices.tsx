import { useState } from "react";
import {
  HeartPulse,
  Wheat,
  Building,
  CheckCircle2,
  Lock,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useEntity } from "@/context/EntityContext";

const portalConfig: Record<string, { icon: any; color: string; bgColor: string; title: string }> = {
  healthcare: {
    icon: HeartPulse,
    color: "text-success",
    bgColor: "bg-success/10",
    title: "Healthcare"
  },
  agriculture: {
    icon: Wheat,
    color: "text-warning",
    bgColor: "bg-warning/10",
    title: "Agriculture"
  },
  cityServices: {
    icon: Building,
    color: "text-primary",
    bgColor: "bg-primary/10",
    title: "City Services"
  },
};

interface FieldRowProps {
  label: string;
  value?: string;
  authorized: boolean;
}

function FieldRow({ label, value, authorized }: FieldRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <span className="text-sm text-foreground">{label}</span>
      {authorized ? (
        <span className="text-sm font-medium text-foreground">{value || "—"}</span>
      ) : (
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          Not Shared
        </span>
      )}
    </div>
  );
}

export function ConnectedServices() {
  const { currentEntity } = useEntity();
  const [activeTab, setActiveTab] = useState("healthcare");

  if (currentEntity?.type === 'GOVT') {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h2 className="text-lg font-semibold">Not Applicable</h2>
        <p>Verified Service Providers view is not applicable for Government entities.</p>
      </div>
    );
  }


  const consents = currentEntity?.consents || [];
  const activeConsents = consents.filter(c => c.status === 'active');

  // Group consents by service type (simulated mapping)
  const services = {
    healthcare: activeConsents.filter(c => c.serviceName.toLowerCase().includes('health')),
    agriculture: activeConsents.filter(c => c.serviceName.toLowerCase().includes('agri')),
    cityServices: activeConsents.filter(c => c.serviceName.toLowerCase().includes('city') || c.serviceName.toLowerCase().includes('municipal'))
  };

  const renderPortal = (type: keyof typeof services) => {
    const typeServices = services[type];
    const config = portalConfig[type] || portalConfig.cityServices;
    const Icon = config.icon;

    if (typeServices.length === 0) {
      return (
        <div className="section-card py-8 text-center text-muted-foreground">

          <p>No connected {config.title} found.</p>
          <p className="text-xs mt-1">Grant access in the Consent Center to see services here.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {typeServices.map(service => (
          <div key={service.id} className="section-card">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-lg ${config.bgColor}`}>
                <Icon className={`h-8 w-8 ${config.color}`} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">{service.serviceName}</h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Authorized Since: {service.grantedOn}
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Portal
              </Button>
            </div>

            <div className="bg-success/5 border border-success/20 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Shared Attributes:</p>
              <div className="flex flex-wrap gap-2">
                {service.attributes.map(attr => (
                  <span key={attr} className="text-xs px-2 py-1 bg-white border border-border rounded shadow-sm">
                    {attr}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h1 className="page-header">Verified Service Providers</h1>
      <p className="page-description">
        View exactly what each verified service can access. You control what data is shared.
      </p>
      <p className="text-xs text-muted-foreground mt-1 mb-4">
        Services may request access, but only you—the individual—can approve or deny.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="healthcare" className="gap-2">
            <HeartPulse className="h-4 w-4" />
            Healthcare
          </TabsTrigger>
          <TabsTrigger value="agriculture" className="gap-2">
            <Wheat className="h-4 w-4" />
            Agriculture
          </TabsTrigger>
          <TabsTrigger value="cityServices" className="gap-2">
            <Building className="h-4 w-4" />
            City Services
          </TabsTrigger>
        </TabsList>

        <TabsContent value="healthcare">{renderPortal("healthcare")}</TabsContent>
        <TabsContent value="agriculture">{renderPortal("agriculture")}</TabsContent>
        <TabsContent value="cityServices">{renderPortal("cityServices")}</TabsContent>
      </Tabs>
    </div>
  );
}
