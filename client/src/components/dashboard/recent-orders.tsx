import React from "react";
import { useNavigate } from "@/lib/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { LoadingSection } from "@/components/ui/loading";
import { Eye } from "lucide-react";
import { OrderWithDetails } from "@shared/schema";
import type { ColumnDef } from "@tanstack/react-table";

type RecentOrdersProps = {
  orders: OrderWithDetails[];
  isLoading?: boolean;
};

export function RecentOrders({ orders, isLoading = false }: RecentOrdersProps) {
  const [_, navigate] = useNavigate();

  // Format the order date to a human-readable format
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency value
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(value);
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
  const columns: ColumnDef<OrderWithDetails>[] = [
    {
      accessorKey: "orderNumber",
      header: "Mã đơn",
      cell: ({ row }) => <span className="font-medium">#{row.original.orderNumber}</span>
    },
    {
      accessorKey: "customer",
      header: "Khách hàng",
      cell: ({ row }) => <span>{row.original.customer?.name || "Khách lẻ"}</span>
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
      id: "actions",
      cell: ({ row }) => (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary hover:text-primary-dark"
          onClick={() => navigate(`/orders/${row.original.id}`)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Chi tiết
        </Button>
      )
    }
  ];

  return (
    <Card className="border border-neutral-300">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Đơn hàng gần đây</h2>
          <Button 
            variant="ghost" 
            className="text-primary text-sm"
            onClick={() => navigate("/orders")}
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
              data={orders}
              searchPlaceholder="Tìm theo mã đơn hoặc khách hàng..."
              pageSize={5}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
