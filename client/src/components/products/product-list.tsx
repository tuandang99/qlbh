import React, { useState } from "react";
import { useNavigate } from "@/lib/navigation";
import { 
  Package, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Plus,
  FileBarChart 
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Product, Category } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ColumnDef } from "@tanstack/react-table";

interface ProductListProps {
  products: Product[];
  categories: Category[];
  isLoading?: boolean;
}

export function ProductList({ products, categories, isLoading = false }: ProductListProps) {
  const [_, navigate] = useNavigate();
  const queryClient = useQueryClient();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Get category name by ID
  const getCategoryName = (categoryId: number | null | undefined) => {
    if (!categoryId) return "-";
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "-";
  };

  // Get stock status icon and text
  const getStockStatus = (product: Product) => {
    const { stockQuantity, alertThreshold = 5 } = product;
    
    if (stockQuantity <= 0) {
      return { 
        icon: <AlertTriangle className="h-4 w-4 mr-1 text-red-600" />,
        text: "Hết hàng",
        variant: "danger" as const
      };
    } else if (stockQuantity <= alertThreshold) {
      return { 
        icon: <AlertTriangle className="h-4 w-4 mr-1 text-red-600" />,
        text: "Sắp hết hàng",
        variant: "danger" as const
      };
    } else if (stockQuantity <= alertThreshold * 2) {
      return { 
        icon: <AlertTriangle className="h-4 w-4 mr-1 text-amber-600" />,
        text: "Cần nhập thêm",
        variant: "warning" as const
      };
    } else {
      return { 
        icon: <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />,
        text: "Đủ hàng",
        variant: "success" as const
      };
    }
  };

  // Delete product mutation
  const { mutate: deleteProduct, isPending: isDeleting } = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Sản phẩm đã được xóa",
        description: "Sản phẩm đã được xóa thành công.",
        variant: "success",
      });
      setProductToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi khi xóa sản phẩm",
        description: error.message || "Đã xảy ra lỗi khi xóa sản phẩm.",
        variant: "destructive",
      });
    },
  });

  // Calculate profit margin
  const calculateProfitMargin = (costPrice: number, sellingPrice: number) => {
    if (costPrice === 0) return 100;
    const margin = ((sellingPrice - costPrice) / costPrice) * 100;
    return Math.round(margin * 10) / 10; // Round to 1 decimal place
  };

  // Define columns for data table
  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: "Sản phẩm",
      cell: ({ row }) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded border border-neutral-300 flex items-center justify-center bg-neutral-100 mr-3">
            <Package className="h-5 w-5 text-neutral-500" />
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
      accessorKey: "costPrice",
      header: "Giá nhập",
      cell: ({ row }) => <div className="text-sm">{formatCurrency(row.original.costPrice)}</div>
    },
    {
      accessorKey: "sellingPrice",
      header: "Giá bán",
      cell: ({ row }) => <div className="text-sm font-medium">{formatCurrency(row.original.sellingPrice)}</div>
    },
    {
      accessorKey: "profit",
      header: "Lợi nhuận",
      cell: ({ row }) => {
        const margin = calculateProfitMargin(row.original.costPrice, row.original.sellingPrice);
        return (
          <div className="text-sm">
            {formatCurrency(row.original.sellingPrice - row.original.costPrice)}
            <span className="text-xs text-green-600 ml-1">({margin}%)</span>
          </div>
        );
      }
    },
    {
      accessorKey: "stockQuantity",
      header: "Tồn kho",
      cell: ({ row }) => {
        const { stockQuantity, alertThreshold = 5 } = row.original;
        return (
          <div className={`text-sm font-medium ${
            stockQuantity <= alertThreshold 
              ? 'text-red-600' 
              : stockQuantity <= alertThreshold * 2 
                ? 'text-amber-600' 
                : ''
          }`}>
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
        return <Badge variant={status.variant}>{status.text}</Badge>;
      }
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/products/${row.original.id}`)}
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProductToDelete(row.original)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </AlertDialogTrigger>
          </AlertDialog>
        </div>
      )
    }
  ];

  // Custom filter function for products
  const filterProducts = (data: Product[], search: string) => {
    return data.filter(product => 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(search.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(search.toLowerCase()))
    );
  };

  return (
    <>
      <Card className="mb-6 border border-neutral-300">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Danh sách sản phẩm</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <FileBarChart className="h-4 w-4 mr-2" />
                Xuất Excel
              </Button>
              <Button size="sm" onClick={() => navigate("/products/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm sản phẩm
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={products}
            isLoading={isLoading}
            searchPlaceholder="Tìm kiếm theo tên, SKU, mã vạch..."
            filterFunction={filterProducts}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Delete Product Confirmation Dialog */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa sản phẩm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa sản phẩm "{productToDelete?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (productToDelete) {
                  deleteProduct(productToDelete.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
