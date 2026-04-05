'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { superAdminTenantService } from '@/services/superAdminTenantService';
import { PagedTenantResponse, TenantSummaryResponse } from '@/types/superAdmin';
import { 
  Building2, 
  Search, 
  MoreVertical, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  Package,
  Users,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';

import ProvisionTenantModal from './ProvisionTenantModal';

export default function SuperAdminTenantsPage() {
  const router = useRouter();
  const [data, setData] = useState<PagedTenantResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);

  const loadTenants = useCallback(async () => {
    try {
      setLoading(true);
      const res = await superAdminTenantService.listTenants(page, 10, searchTerm || undefined, filterActive);
      setData(res);
    } catch (err) {
      console.error('Failed to load tenants', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filterActive]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0); // Reset to first page
    loadTenants();
  };

  const handleToggleStatus = async (tenantId: string, currentActive: boolean) => {
    console.log(`Attempting status toggle for tenant ${tenantId}. Current active: ${currentActive}`);
    if (!confirm(`Are you sure you want to ${currentActive ? 'suspend' : 'activate'} this tenant?`)) return;
    
    try {
      setLoading(true);
      await superAdminTenantService.toggleTenantStatus(tenantId, currentActive ? 'suspend' : 'activate');
      console.log('Status update successful, reloading tenants...');
      await loadTenants(); // Reload the data
    } catch (err) {
      console.error('Failed to update tenant status', err);
      alert('Failed to update tenant status');
    } finally {
      setLoading(false);
    }
  };

  const renderPlanBadge = (plan: string) => {
    switch (plan) {
      case 'SMALL_BUSINESS':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Small Business</span>;
      case 'MEDIUM_BUSINESS':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">Medium Business</span>;
      case 'ENTERPRISE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit"><ShieldAlert className="w-3 h-3"/> Enterprise</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-50 text-gray-700 border border-gray-200">{plan}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-gray-400" />
            Registered Tenants
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage partner subscriptions and platform access</p>
        </div>
        <button 
          onClick={() => setIsProvisionModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors w-full sm:w-auto"
        >
          + Provision New Tenant
        </button>
      </div>

      <ProvisionTenantModal 
        isOpen={isProvisionModalOpen} 
        onClose={() => setIsProvisionModalOpen(false)} 
        onSuccess={() => {
          setIsProvisionModalOpen(false);
          setPage(0);
          loadTenants();
        }}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {/* Filters Area */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 bg-gray-50/50">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by company name or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </form>
          <select 
            className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filterActive === undefined ? 'ALL' : filterActive ? 'ACTIVE' : 'SUSPENDED'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'ALL') setFilterActive(undefined);
              else setFilterActive(val === 'ACTIVE');
              setPage(0);
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Tenant / Domain</th>
                <th className="px-6 py-4">Subscription Plan</th>
                <th className="px-6 py-4">Resource Limits</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                    Loading tenants securely...
                  </td>
                </tr>
              ) : data?.content.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                    No tenants match your search parameters.
                  </td>
                </tr>
              ) : (
                data?.content.map((t: TenantSummaryResponse) => (
                  <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{t.name}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{t.domain}</div>
                      <div className="text-gray-400 text-xs mt-1">Joined {format(new Date(t.createdAt), 'MMM yyyy')}</div>
                    </td>
                    <td className="px-6 py-4">
                      {renderPlanBadge(t.planTier)}
                      {t.isSubscriptionExpired && <div className="text-xs text-red-500 mt-1 font-medium">Expired {t.subscriptionEnd && format(new Date(t.subscriptionEnd), 'PP')}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 text-xs text-gray-600">
                        <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400"/> {t.maxLocations} Locations</div>
                        <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-gray-400"/> {t.maxUsers} Users</div>
                        <div className="flex items-center gap-2"><Package className="w-3.5 h-3.5 text-gray-400"/> {t.maxProducts} Catalog</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(t.id, t.isActive);
                        }}
                        disabled={loading}
                        className={`group px-3 py-1.5 rounded-full flex items-center gap-2 font-bold text-xs border transition-all shadow-sm ${
                          t.isActive 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20 hover:text-emerald-400' 
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20 hover:text-rose-400 animate-pulse-subtle'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={t.isActive ? "Click to Suspend" : "Click to Reactivate"}
                      >
                        {t.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> 
                            <span className="uppercase tracking-wider">Active</span>
                            <span className="hidden group-hover:inline ml-1 text-[10px]">— Suspend?</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> 
                            <span className="uppercase tracking-wider">Suspended</span>
                            <span className="hidden group-hover:inline ml-1 text-[10px]">— Restore?</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block group">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden hidden group-hover:block z-20 origin-top-right">
                          <button 
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                            onClick={() => router.push(`/super-admin/tenants/${t.id}`)}
                          >
                            View Configuration
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(t.id, t.isActive)}
                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${t.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          >
                            {t.isActive ? 'Suspend Access' : 'Restore Access'}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white text-sm">
            <div className="text-gray-500">
              Showing page <span className="font-medium text-gray-900">{data.page + 1}</span> of <span className="font-medium text-gray-900">{data.totalPages}</span> ({data.totalElements} total tenants)
            </div>
            <div className="flex items-center gap-2">
              <button 
                disabled={data.first} 
                onClick={() => setPage((p: number) => p - 1)}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                disabled={data.last} 
                onClick={() => setPage((p: number) => p + 1)}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
