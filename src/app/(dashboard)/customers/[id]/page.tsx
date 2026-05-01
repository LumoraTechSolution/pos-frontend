'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Mail, Phone, MapPin, Star, Calendar, Receipt, ShoppingBag, Loader2 } from 'lucide-react';
import { customerService } from '@/services/customerService';
import { salesService, SaleResponse } from '@/services/salesService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const [salesPage, setSalesPage] = useState(0);

  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerService.getCustomer(customerId),
    enabled: !!customerId
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['customer-sales', customerId, salesPage],
    queryFn: () => salesService.getSalesByCustomer(customerId, salesPage, 10),
    enabled: !!customerId
  });

  if (customerLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Customer not found.</p>
        <Button variant="link" onClick={() => router.push('/customers')} className="text-primary mt-4">
          Return to directory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-6">
      {/* Header Setup */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/customers')} className="text-gray-400 hover:text-white">
          <ChevronLeft size={24} />
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <Calendar size={14} /> Member since {new Date(customer.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Hero Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/10 border-primary/20 shadow-xl col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-primary">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-gray-300">
              <Phone size={18} className="text-emerald-500" />
              <span className="font-medium">{customer.phone || 'No phone number'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Mail size={18} className="text-blue-500" />
              <span className="font-medium">{customer.email || 'No email address'}</span>
            </div>
            <div className="flex items-start gap-3 text-gray-300">
              <MapPin size={18} className="text-red-400 shrink-0 mt-1" />
              <span className="font-medium leading-relaxed max-w-sm">{customer.address || 'No address provided'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800 shadow-xl text-center flex flex-col justify-center items-center py-8">
          <Star size={48} className="text-primary mb-4" fill="currentColor" />
          <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-1">Loyalty Points</h3>
          <p className="text-5xl font-black text-white">{customer.loyaltyPoints}</p>
        </Card>
      </div>

      {/* Tabs area */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="bg-gray-900 border-gray-800">
          <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Receipt size={16} className="mr-2" /> Purchase History
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Star size={16} className="mr-2" /> Loyalty Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden">
            <CardHeader className="bg-black/20 pb-4">
              <CardTitle className="text-lg font-bold text-gray-300">Past Transactions</CardTitle>
              <CardDescription>A complete log of previous sales for this customer.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-black/40">
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest pl-6">Date</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Invoice</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Items</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Payment</TableHead>
                    <TableHead className="text-right text-gray-400 font-bold uppercase text-[10px] tracking-widest pr-6">Net Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <Loader2 className="animate-spin text-primary inline-block" size={32} />
                      </TableCell>
                    </TableRow>
                  ) : !salesData || salesData.content.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center text-gray-500">
                        <ShoppingBag size={48} className="opacity-10 mx-auto mb-2" />
                        <p className="font-medium">No purchase history found.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesData.content.map((sale: SaleResponse) => (
                      <TableRow key={sale.id} className="border-gray-800 hover:bg-white/5 transition-colors">
                        <TableCell className="py-4 pl-6 text-gray-300">
                          {new Date(sale.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-primary">{sale.invoiceNumber}</TableCell>
                        <TableCell className="text-gray-400 text-xs">
                          {sale.items.length} items (Avg {(sale.netAmount / Math.max(sale.items.length, 1)).toFixed(2)}/item)
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-[10px] font-bold">
                            {sale.paymentMethod}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6 font-bold text-emerald-400">
                          ${sale.netAmount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {salesData && salesData.totalPages > 1 && (
                <div className="p-4 border-t border-gray-800 flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-medium">
                    Showing {(salesPage * 10) + 1} to {Math.min((salesPage + 1) * 10, salesData.totalElements)} of {salesData.totalElements} sales
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      disabled={salesPage === 0} 
                      onClick={() => setSalesPage(p => p - 1)}
                      variant="outline" 
                      size="sm" 
                      className="bg-gray-950 border-gray-800 text-gray-400 h-8"
                    >
                      Previous
                    </Button>
                    <Button 
                      disabled={(salesPage + 1) >= salesData.totalPages} 
                      onClick={() => setSalesPage(p => p + 1)}
                      variant="outline" 
                      size="sm" 
                      className="bg-gray-950 border-gray-800 text-gray-400 h-8"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loyalty" className="mt-6">
          <Card className="bg-gray-900 border-gray-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-300">Loyalty Mechanics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-400 flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-gray-800">
                <Star size={48} className="text-primary opacity-20 mb-4" />
                <p className="max-w-md">Detailed loyalty point ledger (earning vs redemption history) will be implemented in a future update.</p>
                <div className="mt-4 p-4 bg-black/40 rounded-lg text-sm text-left w-full max-w-sm">
                  <p className="font-bold flex justify-between mb-2"><span>Current Balance:</span> <span className="text-primary">{customer.loyaltyPoints} pts</span></p>
                  <p className="font-bold flex justify-between text-gray-500"><span>Est. Value:</span> <span>${(customer.loyaltyPoints * 0.1).toFixed(2)}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
