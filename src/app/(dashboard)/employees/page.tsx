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
  Search,
  Pencil,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Clock,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { FeatureGuard } from "@/components/auth/FeatureGuard";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  MANAGER: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  CASHIER: "bg-primary/10 text-primary border-primary/30",
  INVENTORY_MANAGER: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

const ALL_ROLES = ["ADMIN", "MANAGER", "CASHIER", "INVENTORY_MANAGER"];

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_COLORS[role] ?? "bg-gray-700 text-gray-400 border-gray-600";
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
      <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
            <UserPlus size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Add New Employee</h2>
            <p className="text-sm text-gray-500 mt-0.5">Create a staff account for your business</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">First Name *</label>
              <Input placeholder="John" className="bg-gray-900 border-gray-700" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Last Name *</label>
              <Input placeholder="Doe" className="bg-gray-900 border-gray-700" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Email Address *</label>
            <Input type="email" placeholder="john@example.com" className="bg-gray-900 border-gray-700" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Password *</label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="Min 8 characters" className="bg-gray-900 border-gray-700 pr-10" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">PIN (4 digits)</label>
              <Input type="password" placeholder="••••" maxLength={4} className="bg-gray-900 border-gray-700" value={form.pin} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Phone</label>
            <Input placeholder="+1 234 567 8900" className="bg-gray-900 border-gray-700" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Assign Roles *</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_ROLES.map((role) => (
                <button key={role} type="button" onClick={() => toggleRole(role)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${form.roleNames.includes(role) ? ROLE_COLORS[role] + " border-current" : "border-gray-700 text-gray-500 hover:border-gray-500"}`}>
                  <Shield size={11} className="inline mr-1.5" />{role}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
              {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create user."}
            </p>
          )}
        </div>
        <div className="flex gap-3 mt-8">
          <Button variant="outline" className="flex-1 border-gray-700" onClick={onClose} disabled={isPending}>Cancel</Button>
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
  });

  // Hydrate form when user changes
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? "",
        roleNames: user.roles,
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
      <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-violet-500/10 rounded-xl border border-violet-500/20">
            <Pencil size={20} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Edit Employee</h2>
            <p className="text-sm text-gray-500 mt-0.5">Update {user.firstName}&apos;s details and roles</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Email (read-only) */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Email Address</label>
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-500">
              <Mail size={14} /> {user.email}
              <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded ml-auto">Read only</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">First Name</label>
              <Input className="bg-gray-900 border-gray-700" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Last Name</label>
              <Input className="bg-gray-900 border-gray-700" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Phone</label>
            <Input placeholder="+1 234 567 8900" className="bg-gray-900 border-gray-700" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Roles</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_ROLES.map((role) => (
                <button key={role} type="button" onClick={() => toggleRole(role)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${(form.roleNames ?? []).includes(role) ? ROLE_COLORS[role] + " border-current" : "border-gray-700 text-gray-500 hover:border-gray-500"}`}>
                  <Shield size={11} className="inline mr-1.5" />{role}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
              {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to update user."}
            </p>
          )}
        </div>
        <div className="flex gap-3 mt-8">
          <Button variant="outline" className="flex-1 border-gray-700" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button className="flex-1 bg-violet-600 hover:bg-violet-500" onClick={() => mutate(form)} disabled={isPending}>
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

  const { data: users = [], isLoading } = useQuery<UserResponse[]>({
    queryKey: ["users"],
    queryFn: userManagementService.getAll,
  });

  const { mutate: toggleStatus, isPending: toggling } = useMutation({
    mutationFn: (id: string) => userManagementService.toggleStatus(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const filtered = users.filter(
    (u) =>
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

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
          <p className="text-gray-400 mt-1">Manage staff accounts, roles, and access permissions.</p>
        </div>
        <div className="flex gap-3">
          {(currentUser?.roles?.includes('ADMIN') || currentUser?.roles?.includes('MANAGER')) && (
            <FeatureGuard feature="TIME_CLOCK">
              <Button onClick={() => router.push('/employees/timesheets')} variant="outline" className="border-gray-700 bg-gray-900 hover:bg-gray-800 text-gray-300 gap-2 h-10 shadow-sm">
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
                {isLimitReached ? <Shield size={16} className="text-amber-400" /> : <UserPlus size={16} />}
                Add Employee
              </Button>
              {isLimitReached && (
                <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Plan Limit Reached
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`bg-gray-900 border ${isLimitReached ? 'border-amber-500/30' : 'border-gray-800'} rounded-xl p-4 flex items-center justify-between transition-colors`}>
          <div className="space-y-0.5">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total Employees</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${isLimitReached ? 'text-amber-400' : 'text-white'}`}>{users.length}</span>
              <span className="text-xs text-gray-600">/ {maxUsers}</span>
            </div>
          </div>
          {isLimitReached && (
            <div className="p-2 bg-amber-500/10 rounded-lg">
               <Shield size={18} className="text-amber-500" />
            </div>
          )}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Active</span>
          <span className="text-2xl font-bold text-emerald-400">{activeCount}</span>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Inactive</span>
          <span className="text-2xl font-bold text-red-400">{users.length - activeCount}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <Input placeholder="Search by name or email..." className="pl-9 bg-gray-900 border-gray-700 h-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800 bg-gray-800/50 hover:bg-gray-800/50">
              <TableHead className="text-gray-400 font-medium">Employee</TableHead>
              <TableHead className="text-gray-400 font-medium">Contact</TableHead>
              <TableHead className="text-gray-400 font-medium">Roles</TableHead>
              <TableHead className="text-gray-400 font-medium">Last Login</TableHead>
              <TableHead className="text-gray-400 font-medium">Status</TableHead>
              {currentUser?.roles?.includes('ADMIN') && (
                <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <TableRow key={i} className="border-gray-800">
                  <TableCell colSpan={currentUser?.roles?.includes('ADMIN') ? 6 : 5}><div className="h-5 bg-gray-800 rounded animate-pulse" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow className="border-gray-800">
                <TableCell colSpan={currentUser?.roles?.includes('ADMIN') ? 6 : 5} className="text-center py-12 text-gray-500">No employees found.</TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.id} className="border-gray-800 hover:bg-gray-800/30 transition-colors">
                  {/* Name + Avatar */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium text-white">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Mail size={10} />{user.email}</div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell className="text-gray-400 text-sm">
                    {user.phone ? (
                      <span className="flex items-center gap-1"><Phone size={12} /> {user.phone}</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </TableCell>

                  {/* Roles */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? user.roles.map((r) => <RoleBadge key={r} role={r} />) : <span className="text-gray-600 text-xs">No roles</span>}
                    </div>
                  </TableCell>

                  {/* Last Login */}
                  <TableCell className="text-gray-400 text-sm">
                    {user.lastLoginAt ? (
                      <span className="flex items-center gap-1"><Clock size={12} />{format(new Date(user.lastLoginAt), "MMM dd, HH:mm")}</span>
                    ) : (
                      <span className="text-gray-600">Never</span>
                    )}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    {user.active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded-full">
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
                          className="text-xs h-8 border-gray-700 hover:border-violet-500/50 hover:text-violet-400 hover:bg-violet-500/5 transition-all"
                          onClick={() => setEditingUser(user)}
                        >
                          <Pencil size={12} className="mr-1" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`text-xs h-8 border-gray-700 transition-all ${
                            user.active
                              ? "hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/5"
                              : "hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/5"
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
