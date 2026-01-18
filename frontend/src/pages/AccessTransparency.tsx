import { useEffect, useState } from "react";
import { useEntity } from "@/context/EntityContext";
import { apiService } from "@/services/apiService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Shield, AlertCircle, FileText, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";

interface AccessLog {
  id: string;
  service: string;
  purpose: string;
  timestamp: string;
  attributes: string[];
}

export function AccessTransparency() {
  const { currentEntity } = useEntity();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [currentEntity]);

  const loadLogs = async () => {
    try {
      const data = await apiService.entities.getAccessLogs();
      setLogs(data);
    } catch (err) {
      console.error("Failed to load access logs", err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentEntity) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Access Transparency</h1>
        <p className="text-muted-foreground mt-2">
          Monitor exactly when and why your data is accessed by external services.
        </p>
      </div>

      <div className="grid gap-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Audit Trail Active</AlertTitle>
          <AlertDescription>
            Every data access event is cryptographically logged and immutable.
          </AlertDescription>
        </Alert>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No Access Activity</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                Your data has not been accessed by any external services yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {logs.map((log) => (
                <Card key={log.id} className="transition-all hover:border-primary/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-medium">
                            {log.service}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(log.timestamp), "MMM d, yyyy 'at' h:mm a")}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        LOG-{log.id.slice(0, 8)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Accessed Attributes */}
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Accessed Information
                        </span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(log.attributes || []).map((attr) => (
                            <Badge key={attr} variant="secondary" className="px-2 py-0.5">
                              {attr}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Purpose */}
                      <div className="bg-muted/30 p-3 rounded-md text-sm">
                        <span className="font-semibold text-foreground/80">Purpose: </span>
                        <span className="text-muted-foreground">{log.purpose}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
