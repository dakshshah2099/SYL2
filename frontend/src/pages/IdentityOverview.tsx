import {
  User,
  Shield,
  CreditCard,
  Building,
  FileText,
  Activity,
  Wheat,
  Briefcase,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Lock,
  Box
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { useEntity } from "@/context/EntityContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Attribute } from "@/types";
import { apiService } from "@/services/apiService";
import { toast } from "sonner";

// Define strict categories and their known keys
const CATEGORY_MAP: Record<string, string> = {
  // Personal (Merged Identity)
  fullName: 'personal',
  dob: 'personal',
  gender: 'personal',
  bloodGroup: 'health', // Moved to health
  idNumber: 'personal',
  idType: 'personal',
  passport: 'personal',
  pan: 'personal',

  // Health
  bloodType: 'health',
  allergies: 'health',
  insuranceProvider: 'health',
  insurancePolicy: 'health',

  // Address
  address: 'address',
  city: 'address',
  state: 'address',
  pincode: 'address',
  country: 'address',

  // Professional/Financial
  occupation: 'professional',
  employer: 'professional',
  income: 'professional',
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; description: string }> = {
  personal: { label: "Personal & Identity", icon: User, color: "text-primary", description: "Basic details and identity documents" },
  address: { label: "Address & Location", icon: Building, color: "text-muted-foreground", description: "Current residence and verified locations" },
  health: { label: "Health & Insurance", icon: Activity, color: "text-rose-500", description: "Medical records and insurance details" },
  professional: { label: "Professional & Financial", icon: Briefcase, color: "text-warning", description: "Work and income related data" },
  vault: { label: "Personal Vault", icon: Lock, color: "text-purple-500", description: "Secure storage for custom attributes" }
};

// Organization Configs
const ORG_CATEGORY_MAP: Record<string, string> = {
  legalName: 'legal',
  orgType: 'legal',
  registrationNumber: 'legal',
  dateOfIncorporation: 'legal',
  jurisdiction: 'headquarters',

  address: 'headquarters',
  city: 'headquarters',
  state: 'headquarters',
  pincode: 'headquarters',
  country: 'headquarters',

  officialEmail: 'contact',
  officialPhone: 'contact',
  website: 'contact',

  repName: 'representative',
  repRole: 'representative',
  repIdNumber: 'representative',

  taxId: 'compliance',
  documentStatus: 'compliance'
};

const ORG_CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; description: string }> = {
  legal: { label: "Legal Identity", icon: Building, color: "text-primary", description: "Registered entity details" },
  headquarters: { label: "Headquarters", icon: Box, color: "text-muted-foreground", description: "Official registered address" },
  contact: { label: "Official Contact", icon: Activity, color: "text-blue-500", description: "Communication channels" }, // Reusing Activity as icon placeholder or import Globe
  representative: { label: "Authorized Representative", icon: User, color: "text-warning", description: "Key managerial personnel" },
  compliance: { label: "Compliance & Documents", icon: Shield, color: "text-success", description: "Tax and regulatory filings" },
  vault: { label: "Organization Vault", icon: Lock, color: "text-purple-500", description: "Secure storage for custom attributes" }
};

export function IdentityOverview() {
  const { currentEntity, refreshData } = useEntity();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Add Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("vault");
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Edit State
  const [editAttribute, setEditAttribute] = useState<Attribute | null>(null);
  const [editValue, setEditValue] = useState("");

  // Update editValue when attribute is selected
  useMemo(() => {
    if (editAttribute) setEditValue(editAttribute.value);
  }, [editAttribute]);

  // 1. Copy ID
  const copyToClipboard = () => {
    if (currentEntity) {
      navigator.clipboard.writeText(currentEntity.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 2. Process Attributes into blocks
  const isOrg = currentEntity?.type === 'ORG';
  const currentCategoryMap = isOrg ? ORG_CATEGORY_MAP : CATEGORY_MAP;
  const currentCategoryConfig = isOrg ? ORG_CATEGORY_CONFIG : CATEGORY_CONFIG;

  const groupedAttributes = useMemo(() => {
    if (!currentEntity) return {};

    const details = currentEntity.details || {};

    // Initialize groups based on config keys
    const groups: Record<string, Attribute[]> = {};
    Object.keys(currentCategoryConfig).forEach(key => groups[key] = []);

    Object.entries(details).forEach(([key, value]) => {
      if (key === '_metadata') return; // Skip metadata

      // Determine category: Metadata Override > Standard Map > Vault
      let category = 'vault';
      if (details._metadata?.categories?.[key]) {
        category = details._metadata.categories[key];
      } else if (currentCategoryMap[key]) {
        category = currentCategoryMap[key];
      }

      // Ensure valid category (fallback to vault if mapped category didn't exist in config)
      if (!groups[category]) category = 'vault';

      groups[category].push({
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        value: String(value),
        category: category as any,
        stored: true,
        shared: false, // In a real app, check shared status
        lastAccessed: null,
        visibility: 'private'
      });
    });

    return groups;
  }, [currentEntity, currentCategoryConfig, currentCategoryMap]);

  // 3. Selection Logic
  const toggleSelection = (key: string) => {
    const next = new Set(selectedItems);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedItems(next);
  };

  // 4. Delete Logic
  const handleDeleteClick = () => {
    if (selectedItems.size === 0) return;
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    // Optimistic UI update or wait for API
    const newDetails = { ...currentEntity.details };
    selectedItems.forEach(key => delete newDetails[key]);

    try {
      await apiService.entities.update(currentEntity.id, {
        details: newDetails
      });
      toast.success(`Deleted ${selectedItems.size} attributes`);
      setIsEditing(false);
      setSelectedItems(new Set());
      setIsDeleteConfirmOpen(false);
      refreshData();
    } catch (e) {
      toast.error("Failed to delete attributes");
    }
  };

  // 5. Add Logic
  const handleAddAttribute = async () => {
    if (!newKey || !newValue) return;
    setIsAdding(true);

    const cleanKey = newKey.trim().replace(/\s+/g, '');

    // updates
    const finalDetails = {
      ...currentEntity.details,
      [cleanKey]: newValue,
      _metadata: {
        ...(currentEntity.details?._metadata || {}),
        categories: {
          ...(currentEntity.details?._metadata?.categories || {}),
          [cleanKey]: selectedCategory
        }
      }
    };

    try {
      await apiService.entities.update(currentEntity.id, { details: finalDetails });
      toast.success("Attribute added successfully");
      setNewKey("");
      setNewValue("");
      setSelectedCategory("vault");
      setIsAddOpen(false);
      refreshData();
    } catch (e) {
      toast.error("Failed to add attribute");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editAttribute || !currentEntity) return;

    const updatedDetails = {
      ...currentEntity.details,
      [editAttribute.id]: editValue
    };

    try {
      await apiService.entities.update(currentEntity.id, { details: updatedDetails });
      toast.success("Attribute updated");
      setEditAttribute(null);
      refreshData();
    } catch (e) {
      toast.error("Failed to update attribute");
    }
  };

  const renderBlock = (category: string, attrs: Attribute[]) => {
    // Logic: If empty AND not vault, hide block.
    if (attrs.length === 0 && category !== 'vault') return null;

    const config = currentCategoryConfig[category];
    const Icon = config.icon;

    // Deletion Logic:
    // 1. Organization: ONLY Vault items are deletable.
    // 2. Individual: Personal items are NOT deletable (Identity immutable), others are.
    const isDeletable = isOrg
      ? category === 'vault'
      : category !== 'personal';

    return (
      <div key={category} className="section-card relative group animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Block Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg bg-muted/50 ${config.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">{config.label}</h3>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
            {attrs.length} Items
          </div>
        </div>

        {/* Sub-blocks Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {attrs.length === 0 && category === 'vault' ? (
            <div className="col-span-full py-8 text-center border-2 border-dashed border-muted rounded-lg">
              <Box className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">Vault is empty.</p>
              <p className="text-xs text-muted-foreground">Add secure data here.</p>
            </div>
          ) : (
            attrs.map(attr => (
              <div
                key={attr.id}
                className={`
                            relative p-3 rounded-md border flex flex-col justify-between transition-all group/card
                            ${isEditing && isDeletable && selectedItems.has(attr.id) ? 'border-destructive bg-destructive/5' : 'border-border bg-card/50 hover:bg-muted/30'}
                            ${isEditing && isDeletable ? 'cursor-pointer' : ''}
                            ${isEditing && !isDeletable ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                onClick={() => isEditing && isDeletable && toggleSelection(attr.id)}
              >
                {isEditing && isDeletable && (
                  <div className="absolute top-2 right-2">
                    <Checkbox
                      checked={selectedItems.has(attr.id)}
                    // onClick handled by parent div
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{attr.name}</p>
                    {!isEditing && isDeletable && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover/card:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditAttribute(attr);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-1 break-words">{attr.value}</p>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <StatusBadge status={attr.shared ? "shared" : "not-shared"}>
                    {attr.shared ? "Shared" : "Private"}
                  </StatusBadge>
                  {attr.stored && <span className="text-[10px] text-success flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> Verified</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    !currentEntity ? <div className="p-8 text-center animate-pulse">Loading Identity...</div> :
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="page-header mb-0">Identity Overview</h1>
              <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${currentEntity.verified ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                {currentEntity.verified ? 'Verified' : 'Unverified'}
              </div>
            </div>
            <p className="page-description">Managed by you, shared only with permission.</p>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setSelectedItems(new Set()); }}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteClick}
                  disabled={selectedItems.size === 0}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedItems.size})
                </Button>

                <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Deletion</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-muted-foreground">
                        Are you sure you want to delete <strong>{selectedItems.size}</strong> selected items?
                        This action cannot be undone.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                      <Button variant="destructive" onClick={confirmDelete}>Delete Permanently</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Data
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add to Personal Vault</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(currentCategoryConfig).map(([key, conf]) => (
                              <SelectItem key={key} value={key}>{conf.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Attribute Name</Label>
                        <Input
                          placeholder="e.g. HealthInsurnaceID"
                          value={newKey}
                          onChange={e => setNewKey(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Value</Label>
                        <Input
                          placeholder="Attribute Value"
                          value={newValue}
                          onChange={e => setNewValue(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddAttribute} disabled={isAdding || !newKey || !newValue}>
                        {isAdding ? "Saving..." : "Add to Vault"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Items
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editAttribute} onOpenChange={(open) => !open && setEditAttribute(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Attribute</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Attribute</Label>
                <Input value={editAttribute?.name || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  placeholder="Enter new value"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditAttribute(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={!editValue || editValue === editAttribute?.value}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Identity Card Mini */}
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {currentEntity.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-foreground">{currentEntity.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{currentEntity.id}</span>
                <button onClick={copyToClipboard} className="hover:text-foreground">
                  {copied ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>
          {currentEntity.type !== 'GOVT' && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Trust Score</p>
              <p className="text-lg font-bold text-primary">98/100</p>
            </div>
          )}
        </div>

        {/* Render Blocks */}
        <div>
          {/* Render all configured categories in order */}
          {Object.keys(currentCategoryConfig).map(category => (
            category !== 'vault' && renderBlock(category, groupedAttributes[category] || [])
          ))}

          {/* Vault - Always Visible at bottom */}
          {renderBlock('vault', groupedAttributes['vault'] || [])}
        </div>

      </div>
  );
}
