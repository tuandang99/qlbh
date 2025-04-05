import React, { useState } from "react";
import { useNavigate } from "wouter";
import { 
  User, 
  Edit, 
  Trash2, 
  Star, 
  Plus,
  FileBarChart,
  Receipt
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Customer, Order } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
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

interface CustomerListProps {
  customers: Customer[];
  isLoading?: boolean;
}

export function CustomerList({ customers, isLoading = false }: CustomerListProps) {
  const [_, navigate] = useNavigate();
  const queryClient = useQueryClient();
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Delete customer mutation
  const { mutate: deleteCustomer, isPending: isDeleting } = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Khách hàng đã được xóa",
        description: "Khách hàng đã được xóa thành công.",
        variant: "success",
      });
      setCustomerToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi khi xóa khách hàng",
        description: error.message || "Đã xảy ra lỗi khi xóa khách hàng.",
        variant: "destructive",
      });
    },
  });

  // Define columns for data table
  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700 mr-3">
            <span className="font-medium">
              {row.original.name.split(" ").map(name => name[0]).join("").toUpperCase().substring(0, 2)}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium">{row.original.name}</div>
            {row.original.phone && (
              <div className="text-xs text-neutral-500">{row.original.phone}</div>
            )}
          </div>
        </div>
      )
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div className="text-sm">{row.original.email || "—"}</div>
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
      accessorKey: "loyaltyPoints",
      header: "Điểm tích lũy",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Star className="h-4 w-4 text-amber-500 mr-1" />
          <span className="font-medium">{row.original.loyaltyPoints || 0}</span>
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
            <DropdownMenuItem onClick={() => navigate(`/customers/${row.original.id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/orders/new?customerId=${row.original.id}`)}>
              <Receipt className="h-4 w-4 mr-2" />
              Tạo đơn hàng
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setCustomerToDelete(row.original)}
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

  // Custom filter function for customers
  const filterCustomers = (data: Customer[], search: string) => {
    const lowerSearch = search.toLowerCase();
    return data.filter(customer => 
      customer.name.toLowerCase().includes(lowerSearch) ||
      (customer.phone && customer.phone.includes(search)) ||
      (customer.email && customer.email.toLowerCase().includes(lowerSearch))
    );
  };

  return (
    <>
      <Card className="mb-6 border border-neutral-300">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Danh sách khách hàng</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <FileBarChart className="h-4 w-4 mr-2" />
                Xuất Excel
              </Button>
              <Button size="sm" onClick={() => navigate("/customers/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm khách hàng
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={customers}
            isLoading={isLoading}
            searchPlaceholder="Tìm kiếm theo tên, số điện thoại, email..."
            filterFunction={filterCustomers}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Delete Customer Confirmation Dialog */}
      <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa khách hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khách hàng "{customerToDelete?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (customerToDelete) {
                  deleteCustomer(customerToDelete.id);
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
