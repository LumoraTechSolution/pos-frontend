"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventoryService";
import { 
  Table, TableBody, TableCell, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo, useCallback } from "react";
import CategoryForm from "@/components/inventory/CategoryForm";
import { SortableHeader, SortDirection } from "@/components/ui/SortableHeader";
import { Category } from "@/types/inventory";

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timeout = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timeout);
  }, []);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', debouncedSearch],
    queryFn: () => inventoryService.getCategories(),
  });

  // Client-side sort (since categories is a flat list without backend pagination)
  const sortedCategories = useMemo(() => {
    if (!categories) return [];
    if (!sortKey || !sortDirection) return categories;

    return [...categories].sort((a, b) => {
      let valA: any, valB: any;
      if (sortKey === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortKey === 'createdAt') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [categories, sortKey, sortDirection]);

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

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(direction ? key : null);
    setSortDirection(direction);
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

      {/* Search Bar */}
      <div className="flex gap-4 items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search categories by name..." 
            className="pl-10 bg-gray-950 border-gray-800"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-500">
          {sortedCategories.length} {sortedCategories.length === 1 ? 'category' : 'categories'}
        </div>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-10 text-center text-gray-400">Loading categories...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent bg-gray-800/20">
                  <SortableHeader
                    label="Name"
                    sortKey="name"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Slug"
                    sortKey="slug"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Description"
                    sortKey="description"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Parent"
                    sortKey="parentId"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Tax Rate"
                    sortKey="taxRateName"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Actions"
                    sortKey=""
                    currentSort={null}
                    currentDirection={null}
                    onSort={() => {}}
                    className="text-right"
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCategories.map((category: Category) => (
                  <TableRow key={category.id} className="border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <TableCell className="font-medium text-white">{category.name}</TableCell>
                    <TableCell className="text-gray-400 font-mono text-xs">{category.slug || '-'}</TableCell>
                    <TableCell className="text-gray-400 truncate max-w-[200px]">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {category.parentId ? (
                        categories?.find((c: Category) => c.id === category.parentId)?.name || category.parentId
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {category.taxRateName ? (
                        <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          {category.taxRateName}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic">Default</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(category)}
                          className="hover:bg-primary/20 hover:text-primary"
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
                {sortedCategories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">
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
                    categories={categories || []}
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
