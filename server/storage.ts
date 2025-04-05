import {
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  products, type Product, type InsertProduct,
  customers, type Customer, type InsertCustomer,
  suppliers, type Supplier, type InsertSupplier,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  purchases, type Purchase, type InsertPurchase,
  purchaseItems, type PurchaseItem, type InsertPurchaseItem,
  storeSettings, type StoreSettings, type InsertStoreSettings,
  activityLogs, type ActivityLog, type InsertActivityLog,
  backupLogs, type BackupLog, type InsertBackupLog,
  type DashboardData, type OrderWithDetails
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Category methods
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  getAllCategories(): Promise<Category[]>;

  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getAllProducts(): Promise<Product[]>;
  getLowStockProducts(): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  
  // Customer methods
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  getAllCustomers(): Promise<Customer[]>;
  searchCustomers(query: string): Promise<Customer[]>;
  updateCustomerLoyalty(id: number, points: number): Promise<Customer | undefined>;

  // Supplier methods
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;
  getAllSuppliers(): Promise<Supplier[]>;
  
  // Order methods
  getOrder(id: number): Promise<Order | undefined>;
  getOrderWithDetails(id: number): Promise<OrderWithDetails | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  getRecentOrders(limit: number): Promise<OrderWithDetails[]>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;
  
  // Order Item methods
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  
  // Purchase methods
  getPurchase(id: number): Promise<Purchase | undefined>;
  createPurchase(purchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<Purchase>;
  updatePurchaseStatus(id: number, status: string): Promise<Purchase | undefined>;
  getAllPurchases(): Promise<Purchase[]>;
  getPurchasesBySupplier(supplierId: number): Promise<Purchase[]>;
  
  // Store Settings methods
  getStoreSettings(): Promise<StoreSettings | undefined>;
  updateStoreSettings(settings: Partial<InsertStoreSettings>): Promise<StoreSettings>;
  
  // Activity Log methods
  logActivity(log: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivity(limit: number): Promise<ActivityLog[]>;
  
  // Backup Log methods
  logBackup(log: InsertBackupLog): Promise<BackupLog>;
  getBackupLogs(): Promise<BackupLog[]>;
  
  // Dashboard methods
  getDashboardData(): Promise<DashboardData>;
}

// Lớp MemStorage đã được đơn giản hóa và không sử dụng
export class MemStorage implements IStorage {
  // Triển khai đơn giản bộ nhớ tạm
  async getUser(id: number): Promise<User | undefined> { return undefined; }
  async getUserByUsername(username: string): Promise<User | undefined> { return undefined; }
  async createUser(user: InsertUser): Promise<User> { return { id: 1, ...user }; }
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> { return undefined; }
  async deleteUser(id: number): Promise<boolean> { return true; }
  async getAllUsers(): Promise<User[]> { return []; }
  
  async getCategory(id: number): Promise<Category | undefined> { return undefined; }
  async createCategory(category: InsertCategory): Promise<Category> { return { id: 1, ...category }; }
  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> { return undefined; }
  async deleteCategory(id: number): Promise<boolean> { return true; }
  async getAllCategories(): Promise<Category[]> { return []; }
  
  async getProduct(id: number): Promise<Product | undefined> { return undefined; }
  async getProductBySku(sku: string): Promise<Product | undefined> { return undefined; }
  async getProductByBarcode(barcode: string): Promise<Product | undefined> { return undefined; }
  async createProduct(product: InsertProduct): Promise<Product> { return { id: 1, ...product }; }
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> { return undefined; }
  async deleteProduct(id: number): Promise<boolean> { return true; }
  async getAllProducts(): Promise<Product[]> { return []; }
  async getLowStockProducts(): Promise<Product[]> { return []; }
  async searchProducts(query: string): Promise<Product[]> { return []; }
  
  async getCustomer(id: number): Promise<Customer | undefined> { return undefined; }
  async createCustomer(customer: InsertCustomer): Promise<Customer> { return { id: 1, ...customer }; }
  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> { return undefined; }
  async deleteCustomer(id: number): Promise<boolean> { return true; }
  async getAllCustomers(): Promise<Customer[]> { return []; }
  async searchCustomers(query: string): Promise<Customer[]> { return []; }
  async updateCustomerLoyalty(id: number, points: number): Promise<Customer | undefined> { return undefined; }
  
  async getSupplier(id: number): Promise<Supplier | undefined> { return undefined; }
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> { return { id: 1, ...supplier }; }
  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> { return undefined; }
  async deleteSupplier(id: number): Promise<boolean> { return true; }
  async getAllSuppliers(): Promise<Supplier[]> { return []; }
  
  async getOrder(id: number): Promise<Order | undefined> { return undefined; }
  async getOrderWithDetails(id: number): Promise<OrderWithDetails | undefined> { return undefined; }
  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> { return { id: 1, ...order }; }
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> { return undefined; }
  async getAllOrders(): Promise<Order[]> { return []; }
  async getRecentOrders(limit: number): Promise<OrderWithDetails[]> { return []; }
  async getOrdersByCustomer(customerId: number): Promise<Order[]> { return []; }
  
  async getOrderItems(orderId: number): Promise<OrderItem[]> { return []; }
  
  async getPurchase(id: number): Promise<Purchase | undefined> { return undefined; }
  async createPurchase(purchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<Purchase> { return { id: 1, ...purchase }; }
  async updatePurchaseStatus(id: number, status: string): Promise<Purchase | undefined> { return undefined; }
  async getAllPurchases(): Promise<Purchase[]> { return []; }
  async getPurchasesBySupplier(supplierId: number): Promise<Purchase[]> { return []; }
  
  async getStoreSettings(): Promise<StoreSettings | undefined> { return undefined; }
  async updateStoreSettings(settings: Partial<InsertStoreSettings>): Promise<StoreSettings> { return { id: 1, ...settings } as StoreSettings; }
  
  async logActivity(log: InsertActivityLog): Promise<ActivityLog> { return { id: 1, ...log }; }
  async getRecentActivity(limit: number): Promise<ActivityLog[]> { return []; }
  
  async logBackup(log: InsertBackupLog): Promise<BackupLog> { return { id: 1, ...log }; }
  async getBackupLogs(): Promise<BackupLog[]> { return []; }
  
  async getDashboardData(): Promise<DashboardData> { 
    return {
      stats: { revenue: 0, orders: 0, newCustomers: 0, profit: 0 },
      recentOrders: [],
      recentActivities: [],
      lowStockProducts: [],
      salesByDay: []
    }; 
  }
}

// Sử dụng triển khai database từ file database-storage.ts
import { DatabaseStorage } from './database-storage';

// Xuất đối tượng storage cho ứng dụng sử dụng
export const storage = new DatabaseStorage();