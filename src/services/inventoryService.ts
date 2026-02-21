import api from "./api";
import { 
  Category, CategoryRequest, 
  Brand, BrandRequest, 
  Product, ProductRequest 
} from "@/types/inventory";
import { ApiResponse, Page } from "@/types/common";

export const inventoryService = {
  // --- Categories ---
  getCategories: () => 
    api.get<ApiResponse<Category[]>>("/categories").then(res => res.data.data),
  
  getCategory: (id: string) => 
    api.get<ApiResponse<Category>>(`/categories/${id}`).then(res => res.data.data),
  
  createCategory: (data: CategoryRequest) => 
    api.post<ApiResponse<Category>>("/categories", data).then(res => res.data.data),
  
  updateCategory: (id: string, data: CategoryRequest) => 
    api.put<ApiResponse<Category>>(`/categories/${id}`, data).then(res => res.data.data),
  
  deleteCategory: (id: string) => 
    api.delete<ApiResponse<void>>(`/categories/${id}`).then(res => res.data.data),

  // --- Brands ---
  getBrands: () => 
    api.get<ApiResponse<Brand[]>>("/brands").then(res => res.data.data),
  
  getBrand: (id: string) => 
    api.get<ApiResponse<Brand>>(`/brands/${id}`).then(res => res.data.data),
  
  createBrand: (data: BrandRequest) => 
    api.post<ApiResponse<Brand>>("/brands", data).then(res => res.data.data),
  
  updateBrand: (id: string, data: BrandRequest) => 
    api.put<ApiResponse<Brand>>(`/brands/${id}`, data).then(res => res.data.data),
  
  deleteBrand: (id: string) => 
    api.delete<ApiResponse<void>>(`/brands/${id}`).then(res => res.data.data),

  // --- Products ---
  getProducts: (page = 0, size = 10) => 
    api.get<ApiResponse<Page<Product>>>(`/products?page=${page}&size=${size}`).then(res => res.data.data),
  
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
