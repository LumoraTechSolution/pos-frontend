"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventoryService";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import CategoryForm from "@/components/inventory/CategoryForm";

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: inventoryService.getCategories
  });

  const deleteMutation = useMutation({
    mutationFn: inventoryService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Category deleted");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete category");
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Manage your product categories and hierarchy.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus size={18} /> Add Category
        </Button>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-gray-400">Loading categories...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Slug</TableHead>
                  <TableHead className="text-gray-400">Description</TableHead>
                  <TableHead className="text-gray-400">Parent</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.data?.map((category: any) => (
                  <TableRow key={category.id} className="border-gray-800 hover:bg-gray-800/50">
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-gray-400">{category.slug || '-'}</TableCell>
                    <TableCell className="text-gray-400 truncate max-w-[200px]">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {category.parentId ? (
                        categories?.data?.find((c: any) => c.id === category.parentId)?.name || category.parentId
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(category)}
                          className="hover:bg-indigo-500/20 hover:text-indigo-400"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(category.id)}
                          className="hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {categories?.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                      No categories found.
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
                <CardTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</CardTitle>
              </CardHeader>
              <CardContent>
                 <CategoryForm 
                    initialData={editingCategory}
                    categories={categories?.data || []}
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

