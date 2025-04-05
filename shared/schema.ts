import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, foreignKey, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users (Staff) schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("staff"), // admin, manager, staff, cashier
  active: boolean("active").notNull().default(true),
});

// Categories schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

// Products schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode"),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  costPrice: doublePrecision("cost_price").notNull().default(0),
  sellingPrice: doublePrecision("selling_price").notNull().default(0),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  alertThreshold: integer("alert_threshold").default(5),
});

// Customers schema
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  loyaltyPoints: integer("loyalty_points").default(0),
});

// Suppliers schema
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
});

// Orders schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").references(() => users.id),
  orderDate: timestamp("order_date").notNull().defaultNow(),
  status: text("status").notNull().default("pending"), // pending, completed, cancelled
  totalAmount: doublePrecision("total_amount").notNull().default(0),
  discount: doublePrecision("discount").default(0),
  finalAmount: doublePrecision("final_amount").notNull().default(0),
  paymentMethod: text("payment_method").default("cash"),
  notes: text("notes"),
});

// Order Items schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: doublePrecision("unit_price").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
});

// Purchase Orders (from suppliers)
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  purchaseNumber: text("purchase_number").notNull().unique(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  userId: integer("user_id").references(() => users.id),
  purchaseDate: timestamp("purchase_date").notNull().defaultNow(),
  status: text("status").notNull().default("pending"), // pending, received, cancelled
  totalAmount: doublePrecision("total_amount").notNull().default(0),
});

// Purchase Items schema
export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").notNull().references(() => purchases.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  unitCost: doublePrecision("unit_cost").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
});

// Store Settings schema
export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  taxRate: doublePrecision("tax_rate").default(0),
  currencySymbol: text("currency_symbol").default("đ"),
  openingHours: text("opening_hours"),
});

// Activity Log
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Backup Log
export const backupLogs = pgTable("backup_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  filename: text("filename").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  type: text("type").notNull(), // backup or restore
  success: boolean("success").notNull(),
  notes: text("notes"),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertPurchaseSchema = createInsertSchema(purchases).omit({ id: true });
export const insertPurchaseItemSchema = createInsertSchema(purchaseItems).omit({ id: true });
export const insertStoreSettingsSchema = createInsertSchema(storeSettings).omit({ id: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true });
export const insertBackupLogSchema = createInsertSchema(backupLogs).omit({ id: true });

// Insert Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type InsertPurchaseItem = z.infer<typeof insertPurchaseItemSchema>;
export type InsertStoreSettings = z.infer<typeof insertStoreSettingsSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type InsertBackupLog = z.infer<typeof insertBackupLogSchema>;

// Select Types
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type StoreSettings = typeof storeSettings.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type BackupLog = typeof backupLogs.$inferSelect;

// Extended Schemas with additional validation
export const loginSchema = z.object({
  username: z.string().min(1, "Tên đăng nhập là bắt buộc"),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

export type LoginData = z.infer<typeof loginSchema>;

// Extended Type for Order with Customer and Items
export type OrderWithDetails = Order & {
  customer: Customer | null;
  items: (OrderItem & { product: Product })[];
  user: User;
};

// Extended Type for Dashboard data
export type DashboardData = {
  stats: {
    revenue: number;
    orders: number;
    newCustomers: number;
    profit: number;
  };
  recentOrders: OrderWithDetails[];
  recentActivities: ActivityLog[];
  lowStockProducts: Product[];
  salesByDay: { day: string; amount: number }[];
};
