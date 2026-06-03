"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  userManagementService,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
} from "@/services/userManagementService";
import {
  UserPlus,
  Shield,
  Pencil,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Clock,
  Loader2,
  Eye,
  EyeOff,
  Download,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToCsv, type CsvColumn } from "@/lib/exportCsv";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { FeatureGuard } from "@/components/auth/FeatureGuard";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  MANAGER: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  CASHIER: "bg-primary/10 text-primary border-primary/30",
  INVENTORY_MANAGER: "bg-warning/10 text-warning border-warning/30",
};

const ALL_ROLES = ["ADMIN", "MANAGER", "CASHIER", "INVENTORY_MANAGER"];

const USER_CSV_COLUMNS: CsvColumn<UserResponse>[] = [
  { header: "First Name", value: (u) => u.firstName },
  { header: "Last Name", value: (u) => u.lastName },
  { header: "Email", value: (u) => u.email },
  { header: "Phone", value: (u) => u.phone ?? "" },
  { header: "Roles", value: (u) => u.roles.join("; ") },
  { header: "Status", value: (u) => (u.active ? "Active" : "Inactive") },
  { header: "Last Login", value: (u) => (u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "") },
  { header: "Created", value: (u) => new Date(u.createdAt).toLocaleDateString() },
];

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_COLORS[role] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {role}
    </span>
  );
}

// ─── Create User Modal ───────────────────────────────────────────────────────
function CreateUserModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<CreateUserRequest>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    pin: "",
    phone: "",
    roleNames: ["CASHIER"],
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: userManagementService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
      setForm({ firstName: "", lastName: "", email: "", password: "", pin: "", phone: "", roleNames: ["CASHIER"] });
    },
  });

  if (!open) return null;

  const toggleRole = (role: string) => {
    setForm((f) => ({
      ...f,
      roleNames: f.roleNames.includes(role)
        ? f.roleNames.filter((r) => r !== role)
        : [...f.roleNames, role],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-background border border-border rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
            <UserPlus size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Add New Employee</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Create a staff account for your business</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">First Name *</label>
              <Input placeholder="John" className="bg-card border-border" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Last Name *</label>
              <Input placeholder="Doe" className="bg-card border-border" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Email Address *</label>
            <Input type="email" placeholder="john@example.com" className="bg-card border-border" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Password *</label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="Min 8 characters" className="bg-card border-border pr-10" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">PIN (4 digits)</label>
              <Input type="password" placeholder="••••" maxLength={4} className="bg-card border-border" value={form.pin} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Phone</label>
            <Input placeholder="+1 234 567 8900" className="bg-card border-border" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Assign Roles *</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_ROLES.map((role) => (
                <button key={role} type="button" onClick={() => toggleRole(role)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${form.roleNames.includes(role) ? ROLE_COLORS[role] + " border-current" : "border-border text-muted-foreground hover:border-border"}`}>
                  <Shield size={11} className="inline mr-1.5" />{role}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
              {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create user."}
            </p>
          )}
        </div>
        <div className="flex gap-3 mt-8">
          <Button variant="outline" className="flex-1 border-border" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button className="flex-1 bg-primary hover:bg-primary" onClick={() => mutate(form)} disabled={isPending || !form.firstName || !form.email || !form.password}>
            {isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <UserPlus size={16} className="mr-2" />}
            Create Employee
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit User Modal ─────────────────────────────────────────────────────────
function EditUserModal({
  user,
  onClose,
}: {
  user: UserResponse | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UpdateUserRequest>({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    roleNames: user?.roles ?? [],
    pin: "",
  });

  // Hydrate form when user changes
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? "",
        roleNames: user.roles,
        pin: "",
      });
    }
  }, [user]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: UpdateUserRequest) => userManagementService.update(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
  });

  if (!user) return null;

  const toggleRole = (role: string) => {
    setForm((f) => ({
      ...f,
      roleNames: (f.roleNames ?? []).includes(role)
        ? (f.roleNames ?? []).filter((r) => r !== role)
        : [...(f.roleNames ?? []), role],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-background border border-border rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-violet-500/10 rounded-xl border border-violet-500/20">
            <Pencil size={20} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Edit Employee</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Update {user.firstName}&apos;s details and roles</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Email (read-only) */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Email Address</label>
            <div className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2 text-sm text-muted-foreground">
              <Mail size={14} /> {user.email}
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded ml-auto">Read only</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">First Name</label>
              <Input className="bg-card border-border" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Last Name</label>
              <Input className="bg-card border-border" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Phone</label>
            <Input placeholder="+1 234 567 8900" className="bg-card border-border" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>

          {/* PIN — used for manager approvals (e.g. payment corrections after the
              cashier self-serve window). Blank leaves the existing PIN untouched. */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-muted-foreground block">
                {user.hasPin ? "Reset PIN (4 digits)" : "Set PIN (4 digits)"}
              </label>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${user.hasPin ? "text-success border-success/30 bg-success/10" : "text-warning border-warning/30 bg-warning/10"}`}>
                {user.hasPin ? "PIN set" : "No PIN"}
              </span>
            </div>
            <Input
              type="password"
              inputMode="numeric"
              placeholder={user.hasPin ? "Leave blank to keep current PIN" : "••••"}
              maxLength={4}
              className="bg-card border-border"
              value={form.pin ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "") }))}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Managers need a PIN to approve payment corrections after the 5-minute cashier window.
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Roles</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_ROLES.map((role) => (
                <button key={role} type="button" onClick={() => toggleRole(role)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${(form.roleNames ?? []).includes(role) ? ROLE_COLORS[role] + " border-current" : "border-border text-muted-foreground hover:border-border"}`}>
                  <Shield size={11} className="inline mr-1.5" />{role}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
              {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to update user."}
            </p>
          )}
        </div>
        <div className="flex gap-3 mt-8">
          <Button variant="outline" className="flex-1 border-border" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button
            className="flex-1 bg-violet-600 hover:bg-violet-500"
            onClick={() => {
              const trimmedPin = (form.pin ?? "").trim();
              if (trimmedPin && trimmedPin.length !== 4) {
                toast.error("PIN must be exactly 4 digits");
                return;
              }
              // Omit pin entirely when left blank so the existing PIN is kept.
              const payload: UpdateUserRequest = {
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                roleNames: form.roleNames,
              };
              if (trimmedPin) payload.pin = trimmedPin;
              mutate(payload);
            }}
            disabled={isPending}
          >
            {isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Pencil size={16} className="mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function EmployeesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const canManage = !!currentUser?.roles?.includes("ADMIN");

  const { data: users = [], isLoading } = useQuery<UserResponse[]>({
    queryKey: ["users"],
    queryFn: userManagementService.getAll,
  });

  const { mutate: toggleStatus, isPending: toggling } = useMutation({
    mutationFn: (id: string) => userManagementService.toggleStatus(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, active }: { ids: string[]; active: boolean }) =>
      userManagementService.bulkSetStatus(ids, active),
    onSuccess: (count, { active }) => {
      toast.success(`${count} employee${count === 1 ? "" : "s"} ${active ? "activated" : "deactivated"}`);
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Bulk update failed");
    },
  });

  const filtered = users.filter(
    (u) =>
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every((u) => selected.has(u.id));
  const someSelected = filtered.some((u) => selected.has(u.id));

  const toggleRow = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const togglePage = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const u of filtered) {
        if (checked) next.add(u.id);
        else next.delete(u.id);
      }
      return next;
    });
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.info("No employees to export");
      return;
    }
    exportToCsv("employees", USER_CSV_COLUMNS, filtered);
    toast.success(`Exported ${filtered.length} employee${filtered.length === 1 ? "" : "s"}`);
  };

  // Plan Limit Check
  const maxUsers = currentUser?.maxUsers || 5;
  const isLimitReached = users.length >= maxUsers;
  const activeCount = users.filter((u) => u.active).length;

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
          <p className="text-muted-foreground mt-1">Manage staff accounts, roles, and access permissions.</p>
        </div>
        <div className="flex gap-3">
          {(currentUser?.roles?.includes('ADMIN') || currentUser?.roles?.includes('MANAGER')) && (
            <FeatureGuard feature="TIME_CLOCK">
              <Button onClick={() => router.push('/employees/timesheets')} variant="outline" className="border-border bg-card hover:bg-muted hover:text-foreground text-foreground gap-2 h-10 shadow-sm">
                <Clock size={16} className="text-primary" /> View Timesheets
              </Button>
            </FeatureGuard>
          )}
          {(currentUser?.roles?.includes('ADMIN')) && (
            <div className="flex flex-col items-end gap-1">
              <Button 
                onClick={() => setShowCreate(true)} 
                disabled={isLimitReached}
                className="bg-primary hover:bg-primary gap-2 h-10 shadow-lg shadow-primary/20"
              >
                {isLimitReached ? <Shield size={16} className="text-warning" /> : <UserPlus size={16} />}
                Add Employee
              </Button>
              {isLimitReached && (
                <span className="text-[10px] text-warning font-bold bg-warning/10 px-2 py-0.5 rounded border border-warning/20">
                  Plan Limit Reached
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`bg-card border ${isLimitReached ? 'border-warning/30' : 'border-border'} rounded-xl p-4 flex items-center justify-between transition-colors`}>
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Total Employees</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${isLimitReached ? 'text-warning' : 'text-foreground'}`}>{users.length}</span>
              <span className="text-xs text-muted-foreground">/ {maxUsers}</span>
            </div>
          </div>
          {isLimitReached && (
            <div className="p-2 bg-warning/10 rounded-lg">
               <Shield size={18} className="text-warning" />
            </div>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Active</span>
          <span className="text-2xl font-bold text-success">{activeCount}</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Inactive</span>
          <span className="text-2xl font-bold text-destructive">{users.length - activeCount}</span>
        </div>
      </div>

      {/* Toolbar */}
      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or email..."
        resultsCount={{ shown: filtered.length, total: users.length, label: "employees" }}
        actions={
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download size={16} /> Export
          </Button>
        }
        selectionBar={
          canManage && selected.size > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{selected.size} selected</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkStatusMutation.isPending}
                  onClick={() => bulkStatusMutation.mutate({ ids: Array.from(selected), active: true })}
                  className="gap-2 text-success hover:text-success"
                >
                  <CheckCircle2 size={14} /> Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkStatusMutation.isPending}
                  onClick={() => bulkStatusMutation.mutate({ ids: Array.from(selected), active: false })}
                  className="gap-2 text-muted-foreground"
                >
                  <Ban size={14} /> Deactivate
                </Button>
              </div>
            </div>
          ) : undefined
        }
      />

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/50 hover:bg-muted/50">
              {canManage && (
                <TableHead className="w-12 pl-4">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onCheckedChange={togglePage}
                    aria-label="Select all employees"
                  />
                </TableHead>
              )}
              <TableHead className="text-muted-foreground font-medium">Employee</TableHead>
              <TableHead className="text-muted-foreground font-medium">Contact</TableHead>
              <TableHead className="text-muted-foreground font-medium">Roles</TableHead>
              <TableHead className="text-muted-foreground font-medium">Last Login</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              {currentUser?.roles?.includes('ADMIN') && (
                <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell colSpan={canManage ? 7 : 5}><div className="h-5 bg-muted rounded animate-pulse" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={canManage ? 7 : 5} className="text-center py-12 text-muted-foreground">No employees found.</TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow
                  key={user.id}
                  data-state={selected.has(user.id) ? "selected" : undefined}
                  className="border-border hover:bg-muted/30 data-[state=selected]:bg-primary/5 transition-colors"
                >
                  {canManage && (
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selected.has(user.id)}
                        onCheckedChange={(c) => toggleRow(user.id, c)}
                        aria-label={`Select ${user.firstName} ${user.lastName}`}
                      />
                    </TableCell>
                  )}
                  {/* Name + Avatar */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Mail size={10} />{user.email}</div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell className="text-muted-foreground text-sm">
                    {user.phone ? (
                      <span className="flex items-center gap-1"><Phone size={12} /> {user.phone}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Roles */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? user.roles.map((r) => <RoleBadge key={r} role={r} />) : <span className="text-muted-foreground text-xs">No roles</span>}
                    </div>
                  </TableCell>

                  {/* Last Login */}
                  <TableCell className="text-muted-foreground text-sm">
                    {user.lastLoginAt ? (
                      <span className="flex items-center gap-1"><Clock size={12} />{format(new Date(user.lastLoginAt), "MMM dd, HH:mm")}</span>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    {user.active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                        <XCircle size={12} /> Inactive
                      </span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  {currentUser?.roles?.includes('ADMIN') && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 border-border hover:border-violet-500/50 hover:text-violet-400 hover:bg-violet-500/5 transition-all"
                          onClick={() => setEditingUser(user)}
                        >
                          <Pencil size={12} className="mr-1" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`text-xs h-8 border-border transition-all ${
                            user.active
                              ? "hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5"
                              : "hover:border-success/50 hover:text-success hover:bg-success/5"
                          }`}
                          onClick={() => toggleStatus(user.id)}
                          disabled={toggling}
                        >
                          {user.active ? (
                            <><XCircle size={12} className="mr-1" /> Deactivate</>
                          ) : (
                            <><CheckCircle2 size={12} className="mr-1" /> Activate</>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} />
      <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
    </div>
  );
}
