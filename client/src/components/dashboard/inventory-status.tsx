import React from "react";
import { useNavigate } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { LoadingSection } from "@/components/ui/loading";
import { Package2 } from "lucide-react";
import { Product, Category } from "@shared/schema";
import type { ColumnDef } from "@tanstack/react-table";

type InventoryStatusProps = {
  products: Product[];
  categories?: Category[];
  isLoading?: boolean;
};

export function InventoryStatus({ 
  products, 
  categories = [], 
  isLoading = false 
}: InventoryStatusProps) {
  const [_, navigate] = useNavigate();
  
  // Find category name by ID
  const getCategoryName = (categoryId: number | null | undefined) => {
    if (!categoryId) return "-";
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "-";
  };

  // Get stock status
  const getStockStatus = (product: Product) => {
    const { stockQuantity, alertThreshold = 5 } = product;
    
    if (stockQuantity <= 0) {
      return { 
        label: "Hết hàng", 
        variant: "danger" as const
      };
    } else if (stockQuantity <= alertThreshold) {
      return { 
        label: "Sắp hết hàng", 
        variant: "danger" as const
      };
    } else if (stockQuantity <= alertThreshold * 2) {
      return { 
        label: "Cần nhập thêm", 
        variant: "warning" as const
      };
    } else {
      return { 
        label: "Đủ hàng", 
        variant: "success" as const 
      };
    }
  };

  // Define columns for data table
  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: "Sản phẩm",
      cell: ({ row }) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded border border-neutral-300 flex items-center justify-center bg-neutral-100 mr-3">
            <Package2 className="h-5 w-5 text-neutral-500" />
          </div>
          <div>
            <div className="text-sm font-medium">{row.original.name}</div>
            <div className="text-xs text-neutral-500">SKU: {row.original.sku}</div>
          </div>
        </div>
      )
    },
    {
      accessorKey: "categoryId",
      header: "Danh mục",
      cell: ({ row }) => <div className="text-sm">{getCategoryName(row.original.categoryId)}</div>
    },
    {
      accessorKey: "stockQuantity",
      header: "Tồn kho",
      cell: ({ row }) => {
        const { stockQuantity, alertThreshold = 5 } = row.original;
        return (
          <div className={`text-sm font-medium ${stockQuantity <= alertThreshold ? 'text-red-600' : stockQuantity <= alertThreshold * 2 ? 'text-amber-600' : ''}`}>
            {stockQuantity}
          </div>
        );
      }
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = getStockStatus(row.original);
        return <Badge variant={status.variant}>{status.label}</Badge>;
      }
    }
  ];

  return (
    <Card className="border border-neutral-300">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Trạng thái kho hàng</h2>
          <Button 
            variant="ghost" 
            className="text-primary text-sm"
            onClick={() => navigate("/inventory")}
          >
            Xem tất cả
          </Button>
        </div>
        
        {isLoading ? (
          <LoadingSection />
        ) : (
          <div className="overflow-hidden">
            <DataTable 
              columns={columns} 
              data={products}
              searchPlaceholder="Tìm theo tên sản phẩm hoặc SKU..."
              searchField="name"
              pageSize={4}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
