import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { ProductList } from "@/components/products/product-list";
import { ProductForm } from "@/components/products/product-form";
import { Product, Category } from "@shared/schema";
import { LoadingPage } from "@/components/ui/loading";

export default function Products() {
  const [location] = useLocation();
  const isNew = location === "/products/new";
  const isEdit = location.match(/^\/products\/\d+$/);
  const productId = isEdit ? parseInt(location.split("/")[2]) : undefined;

  // Fetch products
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Get the product for editing
  const product = productId && products ? products.find(p => p.id === productId) : undefined;

  if (isLoadingProducts || isLoadingCategories) {
    return <LoadingPage />;
  }

  if (!products || !categories) {
    return <MainLayout>Failed to load data</MainLayout>;
  }

  return (
    <MainLayout title={isNew ? "Thêm sản phẩm mới" : isEdit ? "Chỉnh sửa sản phẩm" : "Quản lý sản phẩm"}>
      {isNew || isEdit ? (
        <ProductForm 
          product={product} 
          categories={categories} 
          isEdit={!!isEdit}
        />
      ) : (
        <ProductList 
          products={products} 
          categories={categories}
        />
      )}
    </MainLayout>
  );
}
