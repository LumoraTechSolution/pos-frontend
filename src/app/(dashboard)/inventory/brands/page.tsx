"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventoryService";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import BrandForm from "@/components/inventory/BrandForm";

export default function BrandsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);

  const { data: brands, isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: inventoryService.getBrands
  });

  const deleteMutation = useMutation({
    mutationFn: inventoryService.deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success("Brand deleted");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete brand");
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this brand?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (brand: any) => {
    setEditingBrand(brand);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingBrand(null);
    setIsFormOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">Manage product manufacturers and brands.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus size={18} /> Add Brand
        </Button>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>All Brands</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-gray-400">Loading brands...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Website</TableHead>
                  <TableHead className="text-gray-400">Description</TableHead>
                  <TableHead className="text-gray-400">Added Date</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands?.data?.map((brand: any) => (
                  <TableRow key={brand.id} className="border-gray-800 hover:bg-gray-800/50">
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell className="text-indigo-400">
                      {brand.website ? (
                        <a href={brand.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                          <Globe size={14} /> {brand.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-gray-400 truncate max-w-[250px]">
                      {brand.description || '-'}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(brand.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(brand)}
                          className="hover:bg-indigo-500/20 hover:text-indigo-400"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(brand.id)}
                          className="hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {brands?.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                      No brands found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
           <Card className="w-full max-w-md bg-gray-900 border-gray-800 shadow-2xl">
              <CardHeader>
                <CardTitle>{editingBrand ? 'Edit Brand' : 'Create Brand'}</CardTitle>
              </CardHeader>
              <CardContent>
                 <BrandForm 
                    initialData={editingBrand}
                    onSuccess={() => setIsFormOpen(false)}
                    onCancel={() => setIsFormOpen(false)}
                 />
              </CardContent>
           </Card>
        </div>
      )}
    </div>
  );
}
