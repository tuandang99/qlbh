import React, { useState } from "react";
import { useNavigate } from "wouter";
import { 
  Receipt, 
  Eye, 
  Printer, 
  FileDown,
  Plus,
  FileBarChart 
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Order, Customer } from "@shared/schema";
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

interface OrderListProps {
  orders: Order[];
  customers: Customer[];
  isLoading?: boolean;
}

export function OrderList({ orders, customers, isLoading = false }: OrderListProps) {
  const [_, navigate] = useNavigate();
  const queryClient = useQueryClient();
  const [orderToUpdate, setOrderToUpdate] = useState<{ id: number; status: string } | null>(null);
  const [dialogAction, setDialogAction] = useState<"complete" | "cancel" | null>(null);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get customer name by ID
  const getCustomerName = (customerId: number | null | undefined) => {
    if (!customerId) return "Khách lẻ";
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : "Khách lẻ";
  };

  // Update order status mutation
  const { mutate: updateOrderStatus, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PUT", `/api/orders/${id}/status`, { status });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      const actionText = dialogAction === "complete" ? "hoàn thành" : "hủy";
      toast({
        title: `Đơn hàng đã được ${actionText}`,
        description: `Đơn hàng đã được ${actionText} thành công.`,
        variant: "success",
      });
      
      setOrderToUpdate(null);
      setDialogAction(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi khi cập nhật đơn hàng",
        description: error.message || "Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng.",
        variant: "destructive",
      });
    },
  });

  // Handle order status change
  const handleStatusChange = (id: number, status: string) => {
    if (status === "completed") {
      setOrderToUpdate({ id, status });
      setDialogAction("complete");
    } else if (status === "cancelled") {
      setOrderToUpdate({ id, status });
      setDialogAction("cancel");
    }
  };

  // Order status badge component
  const OrderStatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Hoàn thành</Badge>;
      case 'pending':
        return <Badge variant="warning">Đang xử lý</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Đã hủy</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Define columns for data table
  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderNumber",
      header: "Mã đơn",
      cell: ({ row }) => <span className="font-medium">#{row.original.orderNumber}</span>
    },
    {
      accessorKey: "customerId",
      header: "Khách hàng",
      cell: ({ row }) => <span>{getCustomerName(row.original.customerId)}</span>
    },
    {
      accessorKey: "orderDate",
      header: "Ngày đặt",
      cell: ({ row }) => <span className="text-neutral-600">{formatDate(row.original.orderDate)}</span>
    },
    {
      accessorKey: "finalAmount",
      header: "Tổng tiền",
      cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.finalAmount)}</span>
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />
    },
    {
      accessorKey: "paymentMethod",
      header: "Thanh toán",
      cell: ({ row }) => {
        const paymentMethods: Record<string, string> = {
          cash: "Tiền mặt",
          card: "Thẻ",
          transfer: "Chuyển khoản",
          momo: "Ví MoMo"
        };
        return <span>{paymentMethods[row.original.paymentMethod] || row.original.paymentMethod}</span>;
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const isPending = row.original.status === "pending";
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Chi tiết
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/orders/${row.original.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                In hóa đơn
              </DropdownMenuItem>
              {isPending && (
                <>
                  <DropdownMenuItem onClick={() => handleStatusChange(row.original.id, "completed")}>
                    <Badge variant="success" className="mr-2">✓</Badge>
                    Hoàn thành đơn hàng
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(row.original.id, "cancelled")}>
                    <Badge variant="danger" className="mr-2">✕</Badge>
                    Hủy đơn hàng
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  // Custom filter function for orders
  const filterOrders = (data: Order[], search: string) => {
    const lowerSearch = search.toLowerCase();
    return data.filter(order => 
      order.orderNumber.toLowerCase().includes(lowerSearch) ||
      (customers.find(c => c.id === order.customerId)?.name.toLowerCase().includes(lowerSearch))
    );
  };

  return (
    <>
      <Card className="mb-6 border border-neutral-300">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Danh sách đơn hàng</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <FileBarChart className="h-4 w-4 mr-2" />
                Xuất Excel
              </Button>
              <Button size="sm" onClick={() => navigate("/orders/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo đơn hàng
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={orders}
            isLoading={isLoading}
            searchPlaceholder="Tìm kiếm theo mã đơn, khách hàng..."
            filterFunction={filterOrders}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Order Status Update Dialog */}
      <AlertDialog open={!!orderToUpdate} onOpenChange={(open) => !open && setOrderToUpdate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction === "complete" 
                ? "Xác nhận hoàn thành đơn hàng" 
                : "Xác nhận hủy đơn hàng"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction === "complete"
                ? "Bạn có chắc chắn muốn đánh dấu đơn hàng này là đã hoàn thành? Hành động này sẽ cập nhật số lượng tồn kho và điểm tích lũy của khách hàng."
                : "Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này sẽ hoàn lại số lượng sản phẩm vào kho."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (orderToUpdate) {
                  updateOrderStatus(orderToUpdate);
                }
              }}
              className={dialogAction === "complete" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              disabled={isUpdating}
            >
              {isUpdating 
                ? "Đang xử lý..." 
                : dialogAction === "complete" ? "Hoàn thành" : "Hủy đơn hàng"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
