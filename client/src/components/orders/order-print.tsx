import React, { forwardRef } from "react";
import { OrderWithDetails, StoreSettings } from "@shared/schema";
import { CreditCard, Phone, MapPin, Calendar, FileText, User, DollarSign } from "lucide-react";

interface OrderPrintProps {
  order: OrderWithDetails;
  storeSettings?: StoreSettings;
}

const OrderPrint = forwardRef<HTMLDivElement, OrderPrintProps>(({ order, storeSettings }, ref) => {
  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div ref={ref} className="p-8 max-w-3xl mx-auto bg-white text-black print-content">
      {/* Store Info */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">{storeSettings?.storeName || "Cửa hàng bán lẻ"}</h1>
        <p className="text-sm">{storeSettings?.address || "Địa chỉ cửa hàng"}</p>
        <p className="text-sm">SĐT: {storeSettings?.phone || "0123456789"}</p>
      </div>

      {/* Receipt Title */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold border-t border-b py-2">HÓA ĐƠN BÁN HÀNG</h2>
        <p className="mt-2">Số: {order.orderNumber}</p>
        <p>Ngày: {formatDate(order.orderDate)}</p>
      </div>

      {/* Customer Info */}
      <div className="mb-6">
        <h3 className="font-bold border-b mb-2 pb-1">THÔNG TIN KHÁCH HÀNG</h3>
        <div className="grid grid-cols-1 gap-1">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            <span className="font-medium">Khách hàng:</span>
            <span className="ml-2">{order.customer?.name || "Khách lẻ"}</span>
          </div>
          {order.customer?.phone && (
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              <span className="font-medium">Số điện thoại:</span>
              <span className="ml-2">{order.customer.phone}</span>
            </div>
          )}
          {order.customer?.address && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="font-medium">Địa chỉ:</span>
              <span className="ml-2">{order.customer.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Order Details */}
      <div className="mb-6">
        <h3 className="font-bold border-b mb-2 pb-1">CHI TIẾT ĐƠN HÀNG</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">STT</th>
              <th className="text-left py-2">Sản phẩm</th>
              <th className="text-right py-2">ĐVT</th>
              <th className="text-right py-2">SL</th>
              <th className="text-right py-2">Đơn giá</th>
              <th className="text-right py-2">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="py-2">{index + 1}</td>
                <td className="py-2">
                  <div>{item.product.name}</div>
                  <div className="text-xs">{item.product.sku}</div>
                </td>
                <td className="text-right py-2">Cái</td>
                <td className="text-right py-2">{item.quantity}</td>
                <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                <td className="text-right py-2">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mb-6">
        <div className="flex justify-between border-b py-2">
          <span className="font-medium">Tổng tiền hàng:</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>
        <div className="flex justify-between border-b py-2">
          <span className="font-medium">Giảm giá:</span>
          <span>{formatCurrency(order.discount || 0)}</span>
        </div>
        <div className="flex justify-between py-2 font-bold">
          <span>Tổng thanh toán:</span>
          <span>{formatCurrency(order.finalAmount)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="mb-6">
        <div className="flex items-center border-b py-2">
          <CreditCard className="w-4 h-4 mr-2" />
          <span className="font-medium">Phương thức thanh toán:</span>
          <span className="ml-2 capitalize">
            {order.paymentMethod === "cash" ? "Tiền mặt" : 
             order.paymentMethod === "bank_transfer" ? "Chuyển khoản" : 
             order.paymentMethod === "credit_card" ? "Thẻ tín dụng" : 
             order.paymentMethod}
          </span>
        </div>
        {order.notes && (
          <div className="flex items-start border-b py-2">
            <FileText className="w-4 h-4 mr-2 mt-1" />
            <span className="font-medium">Ghi chú:</span>
            <span className="ml-2">{order.notes}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm">
        <p>Cảm ơn quý khách đã mua hàng!</p>
        <p>Hẹn gặp lại quý khách.</p>
      </div>

      <div className="mt-4 grid grid-cols-2 text-center text-sm">
        <div>
          <p className="font-bold">Người mua hàng</p>
          <p className="italic mt-10">(Ký, ghi rõ họ tên)</p>
        </div>
        <div>
          <p className="font-bold">Người bán hàng</p>
          <p className="italic mt-10">(Ký, ghi rõ họ tên)</p>
        </div>
      </div>
    </div>
  );
});

OrderPrint.displayName = "OrderPrint";

export default OrderPrint;