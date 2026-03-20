'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Mail,
  Phone,
  MapPin,
  Star,
  Loader2,
  X,
  Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Customer, CustomerRequest, customerService } from '@/services/customerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CustomerForm } from '@/components/customers/CustomerForm';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () => customerService.getCustomers({ query: search, page, size: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CustomerRequest) => customerService.createCustomer(data),
    onSuccess: () => {
      toast.success('Customer registered successfully');
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to register customer');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerRequest }) => customerService.updateCustomer(id, data),
    onSuccess: () => {
      toast.success('Customer updated successfully');
      setEditingCustomer(null);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update customer');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerService.deleteCustomer(id),
    onSuccess: () => {
      toast.success('Customer deleted');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">Customer <span className="text-primary">Database</span></h1>
          <p className="text-gray-400 text-sm">Manage client profiles and loyalty points.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-primary text-primary-foreground font-bold gap-2">
          <UserPlus size={18} /> Add New Customer
        </Button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg bg-gray-900 border-gray-800 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold text-white">Register New Customer</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)} className="text-gray-500">
                <X size={20} />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <CustomerForm 
                onSubmit={(data) => createMutation.mutate(data)} 
                isLoading={createMutation.isPending} 
              />
            </CardContent>
          </Card>
        </div>
      )}

      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg bg-gray-900 border-gray-800 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold text-white">Edit Customer Profile</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setEditingCustomer(null)} className="text-gray-500">
                <X size={20} />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <CustomerForm 
                initialData={editingCustomer}
                onSubmit={(data) => updateMutation.mutate({ id: editingCustomer.id, data })} 
                isLoading={updateMutation.isPending} 
              />
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden">
        <CardHeader className="bg-black/20 pb-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <CardTitle className="text-lg font-bold text-gray-300">Register</CardTitle>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <Input
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="pl-10 bg-gray-950 border-gray-800 text-white focus:ring-primary"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-black/40">
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest pl-6">Customer</TableHead>
                <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Contact Information</TableHead>
                <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Address</TableHead>
                <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Loyalty Points</TableHead>
                <TableHead className="text-right text-gray-400 font-bold uppercase text-[10px] tracking-widest pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Loader2 className="animate-spin text-primary" size={32} />
                      <p className="font-medium">Loading customer directory...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (data?.content || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                       <UserPlus size={48} className="opacity-10 mb-2" />
                       <p className="font-medium">No customers found</p>
                       <Button variant="link" className="text-primary" onClick={() => setSearch('')}>Clear Search</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.content.map((customer: Customer) => (
                  <TableRow key={customer.id} className="border-gray-800 hover:bg-white/5 transition-colors group">
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg text-xs">
                          {customer.firstName[0]}{customer.lastName?.[0] || ''}
                        </div>
                        <div>
                          <p className="font-bold text-white leading-tight">{customer.firstName} {customer.lastName}</p>
                          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-tighter">Member since {new Date(customer.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Mail size={14} className="text-primary" /> {customer.email || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone size={14} className="text-emerald-500" /> {customer.phone || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-start gap-2 max-w-[200px]">
                          <MapPin size={14} className="text-red-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-gray-400 line-clamp-2">{customer.address || 'No address provided'}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full flex items-center gap-2">
                             <Star size={14} className="text-primary" fill="currentColor" />
                             <span className="font-black text-primary">{customer.loyaltyPoints}</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => router.push(`/customers/${customer.id}`)}
                          className="h-8 w-8 text-indigo-400 hover:bg-indigo-500/10"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setEditingCustomer(customer)}
                          className="h-8 w-8 text-primary hover:bg-primary/10"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(customer.id)}
                          className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <div className="p-4 border-t border-gray-800 flex items-center justify-between">
             <p className="text-xs text-gray-500 font-medium">
               Showing {data?.content.length || 0} of {data?.totalElements || 0} customers
             </p>
             <div className="flex gap-2">
                <Button 
                  disabled={page === 0} 
                  onClick={() => setPage(page - 1)}
                  variant="outline" 
                  size="sm" 
                  className="bg-gray-950 border-gray-800 text-gray-400 h-8"
                >
                  Previous
                </Button>
                <Button 
                  disabled={data ? (page + 1) >= data.totalPages : true} 
                  onClick={() => setPage(page + 1)}
                  variant="outline" 
                  size="sm" 
                  className="bg-gray-950 border-gray-800 text-gray-400 h-8"
                >
                  Next
                </Button>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
