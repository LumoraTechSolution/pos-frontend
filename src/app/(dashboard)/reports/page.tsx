"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  TrendingUp,
  PieChart,
  Users,
  Receipt,
  BarChart3,
  Star,
  Truck,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReturnModal } from "@/components/pos/ReturnModal";
import { ExchangeModal } from "@/components/pos/ExchangeModal";
import { RotateCcw } from "lucide-react";
import { FeatureGuard } from "@/components/auth/FeatureGuard";
import { ReturnItemRequest } from "@/services/returnService";

import { SalesTab } from "./_tabs/SalesTab";
import { ReturnsTab } from "./_tabs/ReturnsTab";
import { InventoryTab } from "./_tabs/InventoryTab";
import { EmployeesTab } from "./_tabs/EmployeesTab";
import { CustomersTab } from "./_tabs/CustomersTab";
import { TaxTab } from "./_tabs/TaxTab";
import { ProfitabilityTab } from "./_tabs/ProfitabilityTab";
import { SupplierSalesTab } from "./_tabs/SupplierSalesTab";
import { StockVarianceTab } from "./_tabs/StockVarianceTab";
import { CashReconciliationTab } from "./_tabs/CashReconciliationTab";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales");
  const [returnSaleId, setReturnSaleId] = useState<string | null>(null);
  const [exchangeData, setExchangeData] = useState<{
    saleId: string;
    returnItems: ReturnItemRequest[];
    returnCredit: number;
  } | null>(null);

  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().setDate(new Date().getDate() - 7)), "yyyy-MM-dd'T'00:00:00"),
    end: format(new Date(), "yyyy-MM-dd'T'23:59:59"),
  });

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground mt-2">
          Analyze your business performance and inventory health.
        </p>
      </div>

      <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 justify-start bg-gray-900/50 p-1 border border-gray-800">
          <TabsTrigger value="sales" className="gap-2 px-2 sm:px-3">
            <TrendingUp size={16} />
            <span className={activeTab === "sales" ? "inline" : "hidden sm:inline"}>Sales History</span>
          </TabsTrigger>
          <FeatureGuard feature="RETURNS">
            <TabsTrigger value="returns" className="gap-2 px-2 sm:px-3">
              <RotateCcw size={16} />
              <span className={activeTab === "returns" ? "inline" : "hidden sm:inline"}>Returns History</span>
            </TabsTrigger>
          </FeatureGuard>
          <FeatureGuard feature="INVENTORY">
            <TabsTrigger value="inventory" className="gap-2 px-2 sm:px-3">
              <PieChart size={16} />
              <span className={activeTab === "inventory" ? "inline" : "hidden sm:inline"}>Inventory Valuation</span>
            </TabsTrigger>
          </FeatureGuard>
          <FeatureGuard feature="EMPLOYEES">
            <TabsTrigger value="employees" className="gap-2 px-2 sm:px-3">
              <Users size={16} />
              <span className={activeTab === "employees" ? "inline" : "hidden sm:inline"}>Employee Performance</span>
            </TabsTrigger>
          </FeatureGuard>
          <FeatureGuard feature="CUSTOMERS">
            <TabsTrigger value="customers" className="gap-2 px-2 sm:px-3">
              <Star size={16} />
              <span className={activeTab === "customers" ? "inline" : "hidden sm:inline"}>Top Customers</span>
            </TabsTrigger>
          </FeatureGuard>
          <FeatureGuard feature="TAX_CONFIG">
            <TabsTrigger value="tax" className="gap-2 px-2 sm:px-3">
              <Receipt size={16} />
              <span className={activeTab === "tax" ? "inline" : "hidden sm:inline"}>Tax Summary</span>
            </TabsTrigger>
          </FeatureGuard>
          <FeatureGuard feature="ADVANCED_ANALYTICS">
            <TabsTrigger value="profitability" className="gap-2 px-2 sm:px-3">
              <BarChart3 size={16} />
              <span className={activeTab === "profitability" ? "inline" : "hidden sm:inline"}>Profitability</span>
            </TabsTrigger>
          </FeatureGuard>
          <FeatureGuard feature="INVENTORY">
            <TabsTrigger value="supplier-sales" className="gap-2 px-2 sm:px-3">
              <Truck size={16} />
              <span className={activeTab === "supplier-sales" ? "inline" : "hidden sm:inline"}>Supplier Sales</span>
            </TabsTrigger>
          </FeatureGuard>
          <FeatureGuard feature="INVENTORY">
            <TabsTrigger value="stock-variance" className="gap-2 px-2 sm:px-3">
              <AlertTriangle size={16} />
              <span className={activeTab === "stock-variance" ? "inline" : "hidden sm:inline"}>Stock Variance</span>
            </TabsTrigger>
          </FeatureGuard>
          <TabsTrigger value="cash-reconciliation" className="gap-2 px-2 sm:px-3">
            <Wallet size={16} />
            <span className={activeTab === "cash-reconciliation" ? "inline" : "hidden sm:inline"}>Cash Reconciliation</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <SalesTab
            dateRange={dateRange}
            onDateChange={setDateRange}
            onReturn={setReturnSaleId}
          />
        </TabsContent>

        <FeatureGuard feature="RETURNS">
          <TabsContent value="returns" className="space-y-6">
            <ReturnsTab />
          </TabsContent>
        </FeatureGuard>

        <FeatureGuard feature="INVENTORY">
          <TabsContent value="inventory" className="space-y-6">
            <InventoryTab />
          </TabsContent>
        </FeatureGuard>

        <FeatureGuard feature="EMPLOYEES">
          <TabsContent value="employees" className="space-y-6">
            <EmployeesTab dateRange={dateRange} onDateChange={setDateRange} />
          </TabsContent>
        </FeatureGuard>

        <FeatureGuard feature="CUSTOMERS">
          <TabsContent value="customers" className="space-y-6">
            <CustomersTab />
          </TabsContent>
        </FeatureGuard>

        <FeatureGuard feature="TAX_CONFIG">
          <TabsContent value="tax" className="space-y-6">
            <TaxTab dateRange={dateRange} onDateChange={setDateRange} />
          </TabsContent>
        </FeatureGuard>

        <FeatureGuard feature="ADVANCED_ANALYTICS">
          <TabsContent value="profitability" className="space-y-6">
            <ProfitabilityTab dateRange={dateRange} onDateChange={setDateRange} />
          </TabsContent>
        </FeatureGuard>

        <FeatureGuard feature="INVENTORY">
          <TabsContent value="supplier-sales" className="space-y-6">
            <SupplierSalesTab dateRange={dateRange} onDateChange={setDateRange} />
          </TabsContent>
        </FeatureGuard>

        <FeatureGuard feature="INVENTORY">
          <TabsContent value="stock-variance" className="space-y-6">
            <StockVarianceTab dateRange={dateRange} onDateChange={setDateRange} />
          </TabsContent>
        </FeatureGuard>

        <TabsContent value="cash-reconciliation" className="space-y-6">
          <CashReconciliationTab dateRange={dateRange} onDateChange={setDateRange} />
        </TabsContent>
      </Tabs>

      {returnSaleId && (
        <ReturnModal
          saleId={returnSaleId}
          onClose={() => setReturnSaleId(null)}
          onExchange={(saleId, items, credit) =>
            setExchangeData({ saleId, returnItems: items, returnCredit: credit })
          }
        />
      )}

      {exchangeData && (
        <ExchangeModal
          saleId={exchangeData.saleId}
          returnItems={exchangeData.returnItems}
          returnCredit={exchangeData.returnCredit}
          onClose={() => setExchangeData(null)}
        />
      )}
    </div>
  );
}
