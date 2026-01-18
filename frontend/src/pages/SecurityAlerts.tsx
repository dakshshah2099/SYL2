import { useState } from "react";
import {
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle2,
  Monitor,
  MapPin,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntity } from "@/context/EntityContext";
import { apiService } from "@/services/apiService";
import { toast } from "sonner";
import { SecurityAlert } from "@/types";

const alertIcons = {
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const alertStyles = {
  warning: {
    bg: "bg-warning/10",
    border: "border-warning/30",
    icon: "text-warning",
  },
  error: {
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    icon: "text-destructive",
  },
  info: {
    bg: "bg-primary/10",
    border: "border-primary/30",
    icon: "text-primary",
  },
};

export function SecurityAlerts() {
  const { sessions, currentSession, terminateSession, terminateAllSessions, currentEntity, refreshData, securityStats } = useEntity();
  const alerts = currentEntity?.alerts || [];

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await apiService.entities.acknowledgeAlert(alertId);
      toast.success("Alert acknowledged");
      refreshData();
    } catch (e) {
      toast.error("Failed to acknowledge");
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      await apiService.entities.dismissAlert(alertId);
      toast.success("Alert dismissed");
      refreshData();
    } catch (e) {
      toast.error("Failed to dismiss");
    }
  };

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div>
      <h1 className="page-header">Security & Alerts</h1>
      <p className="page-description">
        Monitor security events and manage your active sessions across all devices.
      </p>
      <p className="text-xs text-muted-foreground mt-1 mb-4">
        This system enforces uniform security and access policies across all services.
      </p>

      {/* Alert Banner for Critical Items */}
      {unacknowledgedCount > 0 && (
        <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
          <p className="text-sm text-foreground">
            You have <strong>{unacknowledgedCount}</strong> unacknowledged security{" "}
            {unacknowledgedCount === 1 ? "alert" : "alerts"} that require your attention.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Security Alerts */}
        <div className="section-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Security Alerts</h2>

          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
              <p className="text-muted-foreground">No security alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const Icon = alertIcons[alert.type];
                const styles = alertStyles[alert.type];

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${styles.bg} ${styles.border} ${alert.acknowledged ? "opacity-60" : ""
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-foreground">{alert.title}</p>
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.message}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground">
                            {alert.timestamp}
                          </span>
                          {!alert.acknowledged && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="h-7 text-xs"
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="section-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Active Sessions</h2>

          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 rounded-lg border ${session.current
                  ? "border-primary bg-primary/5"
                  : "border-border"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Monitor className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {session.device}
                        {session.current && (
                          <span className="ml-2 text-xs text-primary font-normal">
                            (Current Session)
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {session.location}
                        <span className="text-border">•</span>
                        IP: {session.ip}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Last active: {session.lastActive}
                      </div>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => terminateSession(session.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Terminate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => terminateAllSessions()}
            >
              Terminate All Other Sessions
            </Button>
          </div>
        </div>
      </div>

      {/* Last Login Info */}
      <div className="section-card mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Login History</h2>
        <div className="grid gap-4 sm:grid-cols-3">

          {/* Last Login */}
          <div className="p-4 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">Last Successful Login</p>
            <p className="font-medium text-foreground mt-1">
              {securityStats?.lastLogin ? new Date(securityStats.lastLogin).toLocaleString() : 'Never'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {securityStats?.lastLoginLocation || 'Unknown Location'}
            </p>
          </div>

          {/* Failed Attempts */}
          <div className="p-4 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">Failed Login Attempts</p>
            <p className="font-medium text-foreground mt-1">
              {securityStats?.failedLoginAttempts || 0} in last session
            </p>
            <p className={`text-xs mt-1 ${securityStats?.failedLoginAttempts ? 'text-destructive' : 'text-success'}`}>
              {securityStats?.failedLoginAttempts
                ? 'Suspicious activity detected'
                : 'No suspicious activity'}
            </p>
          </div>

          {/* Password Age */}
          <div className="p-4 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">Password Last Changed</p>
            <p className="font-medium text-foreground mt-1">
              {securityStats?.passwordChangedAt ? new Date(securityStats.passwordChangedAt).toLocaleDateString() : 'Recently'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {securityStats?.passwordChangedAt
                ? `${Math.floor((new Date().getTime() - new Date(securityStats.passwordChangedAt).getTime()) / (1000 * 3600 * 24))} days ago`
                : 'Just now'}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
