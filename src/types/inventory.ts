export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  taxRateId?: string;
  taxRateName?: string;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  website?: string;
  createdAt: string;
}

export interface StockLevel {
  id: string;
  productId: string;
  branchId: string;
  branchName: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  basePrice: number;
  costPrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl?: string;
  isActive: boolean;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  stockLevels?: StockLevel[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  basePrice: number;
  costPrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl?: string;
  categoryId?: string;
  brandId?: string;
  isActive: boolean;
}

export interface CategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  taxRateId?: string;
}

export interface BrandRequest {
  name: string;
  description?: string;
  website?: string;
}
