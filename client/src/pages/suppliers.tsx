import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { SupplierList } from "@/components/suppliers/supplier-list";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { Supplier } from "@shared/schema";
import { LoadingPage } from "@/components/ui/loading";

export default function Suppliers() {
  const [location] = useLocation();
  const isNew = location === "/suppliers/new";
  const isEdit = location.match(/^\/suppliers\/\d+$/);
  const supplierId = isEdit ? parseInt(location.split("/")[2]) : undefined;

  // Fetch suppliers
  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Get the supplier for editing
  const supplier = supplierId && suppliers ? suppliers.find(s => s.id === supplierId) : undefined;

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!suppliers) {
    return <MainLayout>Failed to load suppliers</MainLayout>;
  }

  return (
    <MainLayout title={isNew ? "Thêm nhà cung cấp mới" : isEdit ? "Chỉnh sửa nhà cung cấp" : "Quản lý nhà cung cấp"}>
      {isNew || isEdit ? (
        <SupplierForm 
          supplier={supplier} 
          isEdit={!!isEdit}
        />
      ) : (
        <SupplierList suppliers={suppliers} />
      )}
    </MainLayout>
  );
}
