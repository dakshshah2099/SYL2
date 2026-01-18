import { ReactNode, useState } from "react";
import { useEntity } from "@/context/EntityContext";
import { Link, useLocation } from "react-router-dom";
import {
  Shield, // Kept from original
  User,
  FileCheck, // Kept from original
  History, // Kept from original
  Building2,
  AlertTriangle, // Kept from original
  Settings, // Kept from original
  Menu,
  X, // Kept from original
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun, // Kept from original
  Moon, // Kept from original
  FileText, // Added
  ShieldAlert, // Added
  Eye, // Added
  Globe, // Added
  UserCircle // Added
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { GovChatbot } from "@/components/govt/GovChatbot";
import { UserProfile } from "@/components/ui/UserProfile";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Identity Overview", href: "/dashboard", icon: User },
  { name: "Consent Center", href: "/consent", icon: FileText }, // Changed icon, name/href kept for compatibility
  { name: "Security & Alerts", href: "/security", icon: ShieldAlert }, // Changed icon, name/href kept for compatibility
  { name: "Access Transparency", href: "/access-transparency", icon: Eye }, // Updated to match App.tsx route
  { name: "Service Directory", href: "/services", icon: Globe },
  { name: "Org Approvals", href: "/govt/approvals", icon: Building2 },
  { name: "Organizations", href: "/govt/organizations", icon: Building2 },
  { name: "Settings", href: "/settings", icon: UserCircle },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { currentEntity, theme, setTheme } = useEntity();

  const filteredNavigation = navigation.filter(item => {
    // Govt Logic
    if (currentEntity?.type === 'GOVT') {
      // Show: Identity Overview (Dashboard), Org Approvals
      // Hide: Consent, Access, Services, Security?, Settings?
      if (item.name === "Org Approvals") return true;
      if (item.name === "Organizations") return true;
      if (item.name === "Identity Overview") return true;

      // Hide others for now to keep it clean, or keep Security?
      if (["Consent Center", "Access Transparency", "Verified Service Providers", "Settings"].includes(item.name)) return false;

      return true;
    } else {
      // Non-Govt Logic (Hide Org Approvals)
      if (item.name === "Org Approvals") return false;
      if (item.name === "Organizations") return false;
      return true;
    }
  });

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border h-[88px]",
          collapsed && "justify-center"
        )}>
          <Shield className="h-8 w-8 text-sidebar-primary flex-shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-sidebar-foreground truncate">TrustID</h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">Citizen-Controlled Identity</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  collapsed && "justify-center"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border space-y-4">
          {!collapsed ? (
            <div className="space-y-4">
              <UserProfile />
              <div className="flex items-center justify-between">
                <Link
                  to="/login"
                  className="flex items-center gap-3 px-2 py-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground rounded-md hover:bg-sidebar-accent transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Link>

                <div className="flex items-center gap-1">
                  {/* Theme Toggle for Govt (or everyone) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    title="Toggle Theme"
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                    onClick={() => setCollapsed(!collapsed)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Button variant="ghost" size="icon" className="hover:bg-sidebar-accent">
                <User className="h-5 w-5" />
              </Button>
              <div className="flex flex-col gap-2">
                <Link to="/login" title="Sign Out">
                  <Button variant="ghost" size="icon" className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  onClick={() => setCollapsed(!collapsed)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">TrustID</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-muted-foreground hover:bg-muted"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-14 left-0 right-0 z-40 bg-card border-b border-border shadow-lg">
          <nav className="px-4 py-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        <div className="pt-14 lg:pt-0 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </div>
      </main>

      {/* Govt Chatbot (Global on /govt pages) */}
      {location.pathname.startsWith('/govt') && <GovChatbot />}
    </div>
  );
}
