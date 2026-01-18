import { useState } from "react";
import {
  Shield,
  Bell,
  Clock,

  AlertTriangle,
  Save,
  Trash2,
  Moon,
  Sun,
  Monitor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { apiService } from "@/services/apiService";

const DEFAULT_SETTINGS = {
  defaultConsentDuration: "30 days",
  autoDenyUnknownServices: true,
  notifyOnAccess: true,
  notifyOnNewDevice: true,
  notifyBeforeExpiry: true,

  theme: 'system' as const
};

export function SettingsPage() {
  const { theme, setTheme, currentEntity, updateSettings, logout } = useEntity();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [saved, setSaved] = useState(false);

  // Deletion State
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Change Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    // Auto-save logic
    updateSettings(newSettings);
  };

  const handleSave = () => {
    updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeactivate = async () => {
    if (!deletePassword) return;
    setDeleteLoading(true);
    try {
      const res = await apiService.auth.deleteAccount(deletePassword);
      if (res.error) {
        alert("Error: " + res.error); // Simple feedback for now
      } else {
        // Success
        logout();
        window.location.href = '/';
      }
    } catch (e) {
      alert("Failed to deactivate account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) return;
    setPwdLoading(true);
    try {
      const res = await apiService.auth.changePassword(oldPassword, newPassword);
      if (res.error) {
        alert("Error: " + res.error);
      } else {
        alert("Password updated successfully!");
        setOldPassword("");
        setNewPassword("");
      }
    } catch (e) {
      alert("Failed to update password.");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-header">Settings & Privacy</h1>
      <p className="page-description">
        Configure your privacy preferences, appearance, and account settings
      </p>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <div className="section-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            >
              <Sun className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            >
              <Moon className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Dark</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            >
              <Monitor className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">System</span>
            </button>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="section-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Privacy Settings</h2>
          </div>


          <div className="space-y-6">

            {/* Change Password */}
            <div className="flex items-center justify-between py-4 border-b border-border">
              <div>
                <Label className="text-sm font-medium">Password</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Update your password regularly to keep your account secure
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Change Password</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and a new password.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleChangePassword} disabled={!oldPassword || !newPassword || pwdLoading}>
                      {pwdLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div>
              <Label htmlFor="defaultDuration" className="text-sm font-medium">
                Default Consent Duration
              </Label>
              <p className="text-sm text-muted-foreground mt-1 mb-2">
                When granting access, this duration will be pre-selected
              </p>
              <Select
                value={settings.defaultConsentDuration}
                onValueChange={(value) => updateSetting("defaultConsentDuration", value)}
              >
                <SelectTrigger id="defaultDuration" className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30 days">30 days</SelectItem>
                  <SelectItem value="90 days">90 days</SelectItem>
                  <SelectItem value="180 days">180 days</SelectItem>
                  <SelectItem value="1 year">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-4 border-t border-border">
              <div>
                <Label htmlFor="autoDeny" className="text-sm font-medium cursor-pointer">
                  Auto-Deny Unknown Services
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically reject requests from unverified services
                </p>
              </div>
              <Switch
                id="autoDeny"
                checked={settings.autoDenyUnknownServices}
                onCheckedChange={(checked) =>
                  updateSetting("autoDenyUnknownServices", checked)
                }
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="section-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Notification Preferences
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <Label htmlFor="notifyAccess" className="text-sm font-medium cursor-pointer">
                  Notify on Data Access
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Get notified when a service accesses your data
                </p>
              </div>
              <Switch
                id="notifyAccess"
                checked={settings.notifyOnAccess}
                onCheckedChange={(checked) => updateSetting("notifyOnAccess", checked)}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <Label htmlFor="notifyDevice" className="text-sm font-medium cursor-pointer">
                  Notify on New Device Login
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Alert when your account is accessed from a new device
                </p>
              </div>
              <Switch
                id="notifyDevice"
                checked={settings.notifyOnNewDevice}
                onCheckedChange={(checked) => updateSetting("notifyOnNewDevice", checked)}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <Label htmlFor="notifyExpiry" className="text-sm font-medium cursor-pointer">
                  Consent Expiry Reminders
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Remind before consents expire
                </p>
              </div>
              <Switch
                id="notifyExpiry"
                checked={settings.notifyBeforeExpiry}
                onCheckedChange={(checked) =>
                  updateSetting("notifyBeforeExpiry", checked)
                }
              />
            </div>
          </div>
        </div>



        {/* Account Actions */}
        {/* RESTRICTION: Organization Deletion only allowed in Organization Vault */}
        {currentEntity?.type !== 'ORG' ? (
          <div className="section-card border-destructive/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Danger Zone</h2>
            </div>

            <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">Deactivate Account</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Temporarily disable your digital identity. This will revoke all active
                    consents.
                  </p>
                </div>
                <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Request Deactivation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Deactivate Account</DialogTitle>
                      <DialogDescription>
                        This action is permanent. Please enter your password to confirm.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">• Revoke all consents</li>
                        <li className="flex items-center gap-2">• Delete all data</li>
                      </ul>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Password</Label>
                        <input
                          id="confirm-password"
                          type="password"
                          className="w-full px-3 py-2 border rounded-md bg-background"
                          placeholder="Enter your password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={!deletePassword || deleteLoading}
                        onClick={handleDeactivate}
                      >
                        {deleteLoading ? 'Deactivating...' : 'Confirm Deactivation'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        ) : (
          <div className="section-card bg-muted/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-muted">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Organization Controls</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Organization deletion and critical security controls are restricted to the <strong>Organization Vault</strong>.
            </p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="min-w-[120px]">
            {saved ? (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
