import React, { useState } from "react";
import { useNavigate } from "@/lib/navigation";
import { 
  Truck, 
  Edit, 
  Trash2, 
  Phone, 
  Mail,
  Plus,
  FileBarChart,
  Package
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Supplier } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ColumnDef } from "@tanstack/react-table";

interface SupplierListProps {
  suppliers: Supplier[];
  isLoading?: boolean;
}

export function SupplierList({ suppliers, isLoading = false }: SupplierListProps) {
  const [_, navigate] = useNavigate();
  const queryClient = useQueryClient();
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Delete supplier mutation
  const { mutate: deleteSupplier, isPending: isDeleting } = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Nhà cung cấp đã được xóa",
        description: "Nhà cung cấp đã được xóa thành công.",
        variant: "success",
      });
      setSupplierToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi khi xóa nhà cung cấp",
        description: error.message || "Đã xảy ra lỗi khi xóa nhà cung cấp.",
        variant: "destructive",
      });
    },
  });

  // Define columns for data table
  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "name",
      header: "Nhà cung cấp",
      cell: ({ row }) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded border border-neutral-300 flex items-center justify-center bg-neutral-100 mr-3">
            <Truck className="h-5 w-5 text-neutral-500" />
          </div>
          <div>
            <div className="text-sm font-medium">{row.original.name}</div>
            {row.original.contactPerson && (
              <div className="text-xs text-neutral-500">
                Liên hệ: {row.original.contactPerson}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      accessorKey: "contact",
      header: "Thông tin liên hệ",
      cell: ({ row }) => (
        <div>
          {row.original.phone && (
            <div className="text-sm flex items-center">
              <Phone className="h-3 w-3 mr-1 text-neutral-500" />
              {row.original.phone}
            </div>
          )}
          {row.original.email && (
            <div className="text-sm flex items-center mt-1">
              <Mail className="h-3 w-3 mr-1 text-neutral-500" />
              {row.original.email}
            </div>
          )}
        </div>
      )
    },
    {
      accessorKey: "address",
      header: "Địa chỉ",
      cell: ({ row }) => (
        <div className="text-sm max-w-xs truncate">
          {row.original.address || "—"}
        </div>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              Chi tiết
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/suppliers/${row.original.id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/purchases/new?supplierId=${row.original.id}`)}>
              <Package className="h-4 w-4 mr-2" />
              Tạo đơn nhập hàng
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSupplierToDelete(row.original)}
              className="text-red-600 hover:text-red-700 focus:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  // Custom filter function for suppliers
  const filterSuppliers = (data: Supplier[], search: string) => {
    const lowerSearch = search.toLowerCase();
    return data.filter(supplier => 
      supplier.name.toLowerCase().includes(lowerSearch) ||
      (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(lowerSearch)) ||
      (supplier.phone && supplier.phone.includes(search)) ||
      (supplier.email && supplier.email.toLowerCase().includes(lowerSearch))
    );
  };

  return (
    <>
      <Card className="mb-6 border border-neutral-300">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Danh sách nhà cung cấp</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <FileBarChart className="h-4 w-4 mr-2" />
                Xuất Excel
              </Button>
              <Button size="sm" onClick={() => navigate("/suppliers/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm nhà cung cấp
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={suppliers}
            isLoading={isLoading}
            searchPlaceholder="Tìm kiếm theo tên, người liên hệ, số điện thoại..."
            filterFunction={filterSuppliers}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Delete Supplier Confirmation Dialog */}
      <AlertDialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa nhà cung cấp</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa nhà cung cấp "{supplierToDelete?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (supplierToDelete) {
                  deleteSupplier(supplierToDelete.id);
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
