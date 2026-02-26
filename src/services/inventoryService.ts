import api from "./api";
import { 
  Category, CategoryRequest, 
  Brand, BrandRequest, 
  Product, ProductRequest 
} from "@/types/inventory";
import { ApiResponse, Page } from "@/types/common";

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
  sort?: string;      // e.g. "basePrice,desc" or "name,asc"
}

export const inventoryService = {
  // --- Categories ---
  getCategories: (search?: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const query = params.toString();
    return api.get<ApiResponse<Category[]>>(`/categories${query ? `?${query}` : ''}`).then(res => res.data.data);
  },
  
  getCategory: (id: string) => 
    api.get<ApiResponse<Category>>(`/categories/${id}`).then(res => res.data.data),
  
  createCategory: (data: CategoryRequest) => 
    api.post<ApiResponse<Category>>("/categories", data).then(res => res.data.data),
  
  updateCategory: (id: string, data: CategoryRequest) => 
    api.put<ApiResponse<Category>>(`/categories/${id}`, data).then(res => res.data.data),
  
  deleteCategory: (id: string) => 
    api.delete<ApiResponse<void>>(`/categories/${id}`).then(res => res.data.data),

  // --- Brands ---
  getBrands: (search?: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const query = params.toString();
    return api.get<ApiResponse<Brand[]>>(`/brands${query ? `?${query}` : ''}`).then(res => res.data.data);
  },
  
  getBrand: (id: string) => 
    api.get<ApiResponse<Brand>>(`/brands/${id}`).then(res => res.data.data),
  
  createBrand: (data: BrandRequest) => 
    api.post<ApiResponse<Brand>>("/brands", data).then(res => res.data.data),
  
  updateBrand: (id: string, data: BrandRequest) => 
    api.put<ApiResponse<Brand>>(`/brands/${id}`, data).then(res => res.data.data),
  
  deleteBrand: (id: string) => 
    api.delete<ApiResponse<void>>(`/brands/${id}`).then(res => res.data.data),

  // --- Products ---
  getProducts: (page = 0, size = 10, filters?: ProductFilters) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('size', size.toString());
    if (filters?.search) params.set('search', filters.search);
    if (filters?.categoryId) params.set('categoryId', filters.categoryId);
    if (filters?.brandId) params.set('brandId', filters.brandId);
    if (filters?.isActive !== undefined) params.set('isActive', filters.isActive.toString());
    if (filters?.sort) params.set('sort', filters.sort);
    return api.get<ApiResponse<Page<Product>>>(`/products?${params.toString()}`).then(res => res.data.data);
  },
  
  getProduct: (id: string) => 
    api.get<ApiResponse<Product>>(`/products/${id}`).then(res => res.data.data),
  
  createProduct: (data: ProductRequest) => 
    api.post<ApiResponse<Product>>("/products", data).then(res => res.data.data),
  
  updateProduct: (id: string, data: ProductRequest) => 
    api.put<ApiResponse<Product>>(`/products/${id}`, data).then(res => res.data.data),
  
  updateStock: (id: string, quantityChange: number) => 
    api.patch<ApiResponse<void>>(`/products/${id}/stock?quantityChange=${quantityChange}`).then(res => res.data.data),
  
  deleteProduct: (id: string) => 
    api.delete<ApiResponse<void>>(`/products/${id}`).then(res => res.data.data),
};
