import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { OrderList } from "@/components/orders/order-list";
import { OrderForm } from "@/components/orders/order-form";
import { Order, Customer, OrderWithDetails } from "@shared/schema";
import { LoadingPage } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/logs/logger";
import { generateOrderPDF } from "@/components/orders/order-pdf";
import ReactDOM from 'react-dom/client';

export default function Orders() {
  const [location] = useLocation();
  const isNew = location === "/orders/new";
  const isDetail = location.match(/^\/orders\/\d+$/);
  const orderId = isDetail ? parseInt(location.split("/")[2]) : undefined;
  const { toast } = useToast();

  // Fetch orders
  const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const response = await fetch("/api/orders", { headers });
      if (!response.ok) throw new Error("Không thể tải danh sách đơn hàng");
      return response.json();
    }
  });

  // Fetch customers for dropdown
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const response = await fetch("/api/customers", { headers });
      if (!response.ok) throw new Error("Không thể tải danh sách khách hàng");
      return response.json();
    }
  });

  // Fetch order details if on detail page
  const { data: orderDetails, isLoading: isLoadingOrderDetails } = useQuery<OrderWithDetails>({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      if (!orderId) throw new Error("Mã đơn hàng không hợp lệ");
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const response = await fetch(`/api/orders/${orderId}`, { headers });
      if (!response.ok) throw new Error("Không thể tải chi tiết đơn hàng");
      return response.json();
    }
  });

  if ((isLoadingOrders || isLoadingCustomers) && !isNew) {
    return <LoadingPage />;
  }

  if (isDetail && isLoadingOrderDetails) {
    return <LoadingPage />;
  }

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

  return (
    <MainLayout title={isNew ? "Tạo đơn hàng mới" : isDetail ? `Chi tiết đơn hàng #${orderDetails?.orderNumber}` : "Quản lý đơn hàng"}>
      {isNew ? (
        <OrderForm />
      ) : isDetail && orderDetails ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold flex items-center">
                Đơn hàng #{orderDetails.orderNumber}
                <Badge variant={orderDetails.status === 'completed' ? 'success' : orderDetails.status === 'cancelled' ? 'danger' : 'warning'} className="ml-3">
                  {orderDetails.status === 'completed' ? 'Hoàn thành' : orderDetails.status === 'cancelled' ? 'Đã hủy' : 'Đang xử lý'}
                </Badge>
              </h1>
              <p className="text-neutral-500">Ngày tạo: {formatDate(orderDetails.orderDate)}</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex items-center"
                onClick={() => {
                  // Import component chỉ khi cần để cải thiện hiệu suất
                  import('@/components/orders/order-print').then(module => {
                    const OrderPrint = module.default;
                    // Render component in vào một div riêng biệt và in nó
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>In hóa đơn: ${orderDetails.orderNumber}</title>
                            <style>
                              body { font-family: Arial, sans-serif; }
                              table { width: 100%; border-collapse: collapse; }
                              th, td { padding: 8px; text-align: left; }
                              th { border-bottom: 1px solid #ddd; }
                              .text-right { text-align: right; }
                              .border-b { border-bottom: 1px solid #ddd; }
                            </style>
                          </head>
                          <body>
                            <div id="print-content"></div>
                          </body>
                        </html>
                      `);
                      
                      const printContainer = printWindow.document.getElementById('print-content');
                      if (printContainer) {
                        // Render component vào container
                        const root = ReactDOM.createRoot(printContainer);
                        root.render(<OrderPrint order={orderDetails} />);
                        
                        // Đợi để đảm bảo component đã render xong
                        setTimeout(() => {
                          printWindow.print();
                          printWindow.onafterprint = () => {
                            printWindow.close();
                          };
                        }, 500);
                      }
                    }
                  });
                  
                  toast({
                    title: "In hóa đơn",
                    description: "Đang mở cửa sổ in...",
                  });
                }}
              >
                <Printer className="h-4 w-4 mr-2" />
                In hóa đơn
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center"
                onClick={() => {
                  try {
                    generateOrderPDF(orderDetails);
                    toast({
                      title: "Xuất PDF thành công",
                      description: `Đã lưu hóa đơn ${orderDetails.orderNumber} dưới dạng PDF.`,
                    });
                  } catch (error) {
                    logger.error("Lỗi khi xuất PDF", error);
                    toast({
                      title: "Lỗi xuất PDF",
                      description: "Không thể xuất hóa đơn sang PDF. Vui lòng thử lại.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Xuất PDF
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Order Items */}
              <Card className="border border-neutral-300">
                <CardContent className="p-6">
                  <h2 className="text-lg font-medium mb-4">Sản phẩm</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-300">
                          <th className="text-left py-3 px-4">Sản phẩm</th>
                          <th className="text-right py-3 px-4">Đơn giá</th>
                          <th className="text-center py-3 px-4">Số lượng</th>
                          <th className="text-right py-3 px-4">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderDetails.items.map((item, index) => (
                          <tr key={index} className="border-b border-neutral-300">
                            <td className="py-3 px-4">
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-xs text-neutral-500">SKU: {item.product.sku}</div>
                            </td>
                            <td className="text-right py-3 px-4">{formatCurrency(item.unitPrice)}</td>
                            <td className="text-center py-3 px-4">{item.quantity}</td>
                            <td className="text-right py-3 px-4 font-medium">{formatCurrency(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              {/* Notes */}
              {orderDetails.notes && (
                <Card className="border border-neutral-300">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-medium mb-2">Ghi chú</h2>
                    <p className="text-neutral-700">{orderDetails.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="border border-neutral-300">
                <CardContent className="p-6">
                  <h2 className="text-lg font-medium mb-4">Thông tin thanh toán</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Khách hàng:</span>
                      <span className="font-medium">{orderDetails.customer?.name || "Khách lẻ"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Phương thức:</span>
                      <span>{orderDetails.paymentMethod === 'cash' ? 'Tiền mặt' : 
                             orderDetails.paymentMethod === 'card' ? 'Thẻ' : 
                             orderDetails.paymentMethod === 'transfer' ? 'Chuyển khoản' : 
                             orderDetails.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Nhân viên:</span>
                      <span>{orderDetails.user.fullName}</span>
                    </div>
                    
                    <div className="border-t border-neutral-300 my-3 pt-3">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Tổng tiền hàng:</span>
                        <span>{formatCurrency(orderDetails.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-neutral-600">Giảm giá:</span>
                        <span>{formatCurrency(orderDetails.discount || 0)}</span>
                      </div>
                      <div className="flex justify-between mt-3 font-medium text-lg">
                        <span>Tổng thanh toán:</span>
                        <span className="text-primary">{formatCurrency(orderDetails.finalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {orderDetails.customer && (
                <Card className="border border-neutral-300">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-medium mb-4">Thông tin khách hàng</h2>
                    <div className="space-y-2">
                      <div>
                        <span className="text-neutral-600">Tên:</span>
                        <span className="font-medium block">{orderDetails.customer.name}</span>
                      </div>
                      {orderDetails.customer.phone && (
                        <div>
                          <span className="text-neutral-600">Số điện thoại:</span>
                          <span className="block">{orderDetails.customer.phone}</span>
                        </div>
                      )}
                      {orderDetails.customer.email && (
                        <div>
                          <span className="text-neutral-600">Email:</span>
                          <span className="block">{orderDetails.customer.email}</span>
                        </div>
                      )}
                      {orderDetails.customer.address && (
                        <div>
                          <span className="text-neutral-600">Địa chỉ:</span>
                          <span className="block">{orderDetails.customer.address}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      ) : orders && customers ? (
        <OrderList orders={orders} customers={customers} />
      ) : (
        <div>Failed to load data</div>
      )}
    </MainLayout>
  );
}
