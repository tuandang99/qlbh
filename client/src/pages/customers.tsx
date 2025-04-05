import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { CustomerList } from "@/components/customers/customer-list";
import { CustomerForm } from "@/components/customers/customer-form";
import { Customer } from "@shared/schema";
import { LoadingPage } from "@/components/ui/loading";

export default function Customers() {
  const [location] = useLocation();
  const isNew = location === "/customers/new";
  const isEdit = location.match(/^\/customers\/\d+$/);
  const customerId = isEdit ? parseInt(location.split("/")[2]) : undefined;

  // Fetch customers
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const response = await fetch("/api/customers", { headers });
      if (!response.ok) throw new Error("Không thể tải danh sách khách hàng");
      return response.json();
    }
  });

  // Get the customer for editing
  const customer = customerId && customers ? customers.find(c => c.id === customerId) : undefined;

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!customers) {
    return <MainLayout>Failed to load customers</MainLayout>;
  }

  return (
    <MainLayout title={isNew ? "Thêm khách hàng mới" : isEdit ? "Chỉnh sửa khách hàng" : "Quản lý khách hàng"}>
      {isNew || isEdit ? (
        <CustomerForm 
          customer={customer} 
          isEdit={!!isEdit}
        />
      ) : (
        <CustomerList customers={customers} />
      )}
    </MainLayout>
  );
}
