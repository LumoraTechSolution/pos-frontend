"use client";

import ProductForm from "@/components/inventory/ProductForm";
import { Suspense } from "react";

export default function NewProductPage() {
  return (
    <div className="bg-black min-h-screen">
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading form...</div>}>
        <ProductForm />
      </Suspense>
    </div>
  );
}
