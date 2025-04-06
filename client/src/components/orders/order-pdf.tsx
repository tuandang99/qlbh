import { OrderWithDetails, StoreSettings } from "@shared/schema";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { logger } from "@/logs/logger";

// Chức năng xuất PDF hóa đơn
export const generateOrderPDF = (
  order: OrderWithDetails,
  storeSettings?: StoreSettings
) => {
  try {
    logger.log("Bắt đầu tạo PDF cho đơn hàng", order.orderNumber);
    
    // Khởi tạo đối tượng PDF với khổ giấy A4
    const doc = new jsPDF();
    
    // Thiết lập font
    doc.setFont("helvetica");
    
    // Format tiền tệ
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      })
        .format(value)
        .replace("₫", "VND");
    };
    
    // Format ngày tháng
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
    
    // Thêm thông tin cửa hàng
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(storeSettings?.storeName || "CỬA HÀNG BÁN LẺ", 105, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(storeSettings?.address || "Địa chỉ cửa hàng", 105, 22, { align: "center" });
    doc.text(`SĐT: ${storeSettings?.phone || "0123456789"}`, 105, 27, { align: "center" });
    
    // Tiêu đề hóa đơn
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("HÓA ĐƠN BÁN HÀNG", 105, 40, { align: "center" });
    
    // Số hóa đơn và ngày
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Số: ${order.orderNumber}`, 105, 48, { align: "center" });
    doc.text(`Ngày: ${formatDate(order.orderDate)}`, 105, 53, { align: "center" });
    
    // Thông tin khách hàng
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("THÔNG TIN KHÁCH HÀNG", 14, 65);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Khách hàng: ${order.customer?.name || "Khách lẻ"}`, 14, 72);
    if (order.customer?.phone) {
      doc.text(`Số điện thoại: ${order.customer.phone}`, 14, 77);
    }
    if (order.customer?.address) {
      doc.text(`Địa chỉ: ${order.customer.address}`, 14, 82);
    }
    
    // Chi tiết đơn hàng
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("CHI TIẾT ĐƠN HÀNG", 14, 92);
    
    // Tạo bảng sản phẩm
    const tableColumn = ["STT", "Sản phẩm", "ĐVT", "SL", "Đơn giá", "Thành tiền"];
    const tableRows = order.items.map((item, index) => [
      index + 1,
      `${item.product.name}\n${item.product.sku}`,
      "Cái",
      item.quantity,
      formatCurrency(item.unitPrice),
      formatCurrency(item.subtotal),
    ]);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 97,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 60 },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 15, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
        5: { cellWidth: 30, halign: "right" },
      },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: "bold" },
    });
    
    // Tính toán vị trí tiếp theo dựa trên chiều cao của bảng
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    
    // Thêm thông tin tổng tiền
    const summaryX = 130;
    let currentY = finalY + 10;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Tổng tiền hàng:", summaryX, currentY);
    doc.text(formatCurrency(order.totalAmount), 195, currentY, { align: "right" });
    
    currentY += 6;
    doc.text("Giảm giá:", summaryX, currentY);
    doc.text(formatCurrency(order.discount || 0), 195, currentY, { align: "right" });
    
    currentY += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Tổng thanh toán:", summaryX, currentY);
    doc.text(formatCurrency(order.finalAmount), 195, currentY, { align: "right" });
    
    // Thông tin thanh toán
    currentY += 10;
    doc.setFont("helvetica", "normal");
    doc.text(
      `Phương thức thanh toán: ${
        order.paymentMethod === "cash" 
          ? "Tiền mặt" 
          : order.paymentMethod === "bank_transfer" 
          ? "Chuyển khoản" 
          : order.paymentMethod === "credit_card" 
          ? "Thẻ tín dụng" 
          : order.paymentMethod === "card"
          ? "Thẻ"
          : order.paymentMethod === "transfer"
          ? "Chuyển khoản"
          : order.paymentMethod
      }`,
      14,
      currentY
    );
    
    if (order.notes) {
      currentY += 6;
      doc.text(`Ghi chú: ${order.notes}`, 14, currentY);
    }
    
    // Chân trang
    currentY += 15;
    doc.setFontSize(10);
    doc.text("Cảm ơn quý khách đã mua hàng!", 105, currentY, { align: "center" });
    currentY += 5;
    doc.text("Hẹn gặp lại quý khách.", 105, currentY, { align: "center" });
    
    // Chữ ký
    currentY += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Người mua hàng", 50, currentY, { align: "center" });
    doc.text("Người bán hàng", 160, currentY, { align: "center" });
    
    currentY += 25;
    doc.setFont("helvetica", "italic");
    doc.text("(Ký, ghi rõ họ tên)", 50, currentY, { align: "center" });
    doc.text("(Ký, ghi rõ họ tên)", 160, currentY, { align: "center" });
    
    // Lưu file PDF
    const fileName = `HoaDon_${order.orderNumber}.pdf`;
    doc.save(fileName);
    
    logger.log("Tạo PDF thành công", fileName);
    return fileName;
  } catch (error) {
    logger.error("Lỗi khi tạo PDF", error);
    throw error;
  }
};