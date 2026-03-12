"use client";

import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventoryService";
import ProductForm from "@/components/inventory/ProductForm";
import { useParams } from "next/navigation";

export default function EditProductPage() {
  const { id } = useParams();

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => inventoryService.getProduct(id as string),
    enabled: !!id
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">Loading product details...</div>;
  }

  return (
    <div className="bg-black min-h-screen">
      <ProductForm initialData={productData?.data} />
    </div>
  );
}
