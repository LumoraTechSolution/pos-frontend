"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileDown, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { inventoryService } from "@/services/inventoryService";
import { toast } from "sonner";

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportProductsModal({ isOpen, onClose, onSuccess }: ImportProductsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);
    try {
      const response = await inventoryService.importProducts(file);
      // Backend returns the count of successfully imported products in the `data` wrapper
      const count = response.data;
      setResult({ successCount: count, failureCount: 0 });
      toast.success(`Successfully imported ${count} products`);
      onSuccess();
      setTimeout(onClose, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = "name,sku,barcode,description,category,brand,basePrice,costPrice,stockQuantity,lowStockThreshold";
    const example = "Sample Product,SKU001,12345678,A great product,Electronics,Apple,99.99,70.00,50,5";
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "product_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gray-950 border-gray-800">
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import products into your inventory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div 
            className="border-2 border-dashed border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors cursor-pointer bg-gray-900/20"
            onClick={() => document.getElementById('csv-upload')?.click()}
          >
            <Upload className="text-gray-500" size={32} />
            <div className="text-center">
              <p className="text-sm font-medium">{file ? file.name : "Click to select CSV file"}</p>
              <p className="text-xs text-muted-foreground mt-1">Maximum size 5MB</p>
            </div>
            <input 
              id="csv-upload" 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>

          <Button 
            variant="outline" 
            className="w-full gap-2 border-gray-800 hover:bg-gray-900"
            onClick={downloadTemplate}
          >
            <FileDown size={18} /> Download CSV Template
          </Button>

          {result && result.failureCount > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-medium">
                <AlertCircle size={18} />
                <span>Import Errors ({result.failureCount})</span>
              </div>
              <div className="max-h-[150px] overflow-y-auto space-y-1">
                {result.errors.map((err: any, idx: number) => (
                  <p key={idx} className="text-xs text-red-300">
                    Row {err.rowNumber}: {err.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {result && result.successCount > 0 && result.failureCount === 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="text-emerald-400" size={24} />
              <div>
                <p className="text-sm font-medium text-emerald-400">Import Successful</p>
                <p className="text-xs text-emerald-500/80">{result.successCount} products have been added.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>Cancel</Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="bg-primary hover:bg-primary/90 gap-2"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {isUploading ? "Uploading..." : "Start Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
