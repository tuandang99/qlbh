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
import { IStorage } from "./storage";
import { db } from './db';
import { eq, and, or, lt, gt, desc, gte, ilike } from 'drizzle-orm';

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product;
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    if (!barcode) return undefined;
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    // Đảm bảo các giá trị bắt buộc có đầy đủ cho product
    const productToInsert = {
      ...product,
      costPrice: product.costPrice || 0,
      sellingPrice: product.sellingPrice || 0,
      stockQuantity: product.stockQuantity || 0
    };
    
    const [newProduct] = await db
      .insert(products)
      .values(productToInsert)
      .returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  async getAllProducts(): Promise<Product[]> {
    return db.select().from(products);
  }

  async getLowStockProducts(): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(
        and(
          lt(products.stockQuantity, products.alertThreshold),
          gt(products.alertThreshold, 0)
        )
      );
  }

  async searchProducts(query: string): Promise<Product[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    return db
      .select()
      .from(products)
      .where(
        or(
          ilike(products.name, searchQuery),
          ilike(products.sku, searchQuery),
          ilike(products.barcode || '', searchQuery),
          ilike(products.description || '', searchQuery)
        )
      );
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    await db.delete(customers).where(eq(customers.id, id));
    return true;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return db.select().from(customers);
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    return db
      .select()
      .from(customers)
      .where(
        or(
          ilike(customers.name, searchQuery),
          ilike(customers.phone || '', searchQuery),
          ilike(customers.email || '', searchQuery),
          ilike(customers.address || '', searchQuery)
        )
      );
  }

  async updateCustomerLoyalty(id: number, points: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    if (!customer) return undefined;

    const newPoints = (customer.loyaltyPoints || 0) + points;
    const [updatedCustomer] = await db
      .update(customers)
      .set({ loyaltyPoints: newPoints })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db
      .insert(suppliers)
      .values(supplier)
      .returning();
    return newSupplier;
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set(supplier)
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
    return true;
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers);
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderWithDetails(id: number): Promise<OrderWithDetails | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const orderItemsList = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    const orderItemsWithProducts = await Promise.all(
      orderItemsList.map(async (item) => {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId));
        return { ...item, product };
      })
    );

    let customer = null;
    if (order.customerId) {
      const [foundCustomer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, order.customerId));
      customer = foundCustomer || null;
    }

    const [user] = await db.select().from(users).where(eq(users.id, order.userId || 0));
    if (!user) throw new Error(`User not found for order ${id}`);

    return {
      ...order,
      customer,
      items: orderItemsWithProducts,
      user,
    };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    try {
      console.log("Database createOrder called with:", JSON.stringify(order), JSON.stringify(items));
      
      // Set default values for required fields
      const orderToInsert = {
        ...order,
        status: order.status || 'pending',
        orderDate: order.orderDate || new Date(),
        totalAmount: order.totalAmount || 0,
        finalAmount: order.finalAmount || 0
      };
      
      console.log("Order to insert:", JSON.stringify(orderToInsert));
      
      // Create the order first
      const [newOrder] = await db.insert(orders).values(orderToInsert).returning();
      console.log("Order created:", JSON.stringify(newOrder));

      // Then create all order items
      for (const item of items) {
        // Ensure quantity has a value
        const itemToInsert = {
          ...item,
          orderId: newOrder.id,
          quantity: item.quantity || 0
        };
        
        console.log("Inserting order item:", JSON.stringify(itemToInsert));
        await db.insert(orderItems).values(itemToInsert);

        // Update product stock
        const [product] = await db.select().from(products).where(eq(products.id, item.productId));
        if (product) {
          const newQuantity = product.stockQuantity - (item.quantity || 0);
          await db
            .update(products)
            .set({ stockQuantity: newQuantity })
            .where(eq(products.id, item.productId));
        }
      }

      return newOrder;
    } catch (error) {
      console.error("Error in createOrder database function:", error);
      throw error;
    }
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders);
  }

  async getRecentOrders(limit: number): Promise<OrderWithDetails[]> {
    const recentOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.orderDate))
      .limit(limit);

    const ordersWithDetails = await Promise.all(
      recentOrders.map(async (order) => {
        const details = await this.getOrderWithDetails(order.id);
        if (!details) throw new Error(`Order details not found for order ${order.id}`);
        return details;
      })
    );

    return ordersWithDetails;
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.orderDate));
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async getPurchase(id: number): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase;
  }

  async createPurchase(purchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<Purchase> {
    // Đảm bảo các giá trị bắt buộc
    const purchaseToInsert = {
      ...purchase,
      status: purchase.status || 'pending',
    };
    
    const [newPurchase] = await db.insert(purchases).values(purchaseToInsert).returning();

    for (const item of items) {
      // Đảm bảo quantity có giá trị
      const itemToInsert = {
        ...item,
        purchaseId: newPurchase.id,
        quantity: item.quantity || 0
      };
      
      await db.insert(purchaseItems).values(itemToInsert);

      // Update product stock if purchase is received
      if (purchase.status === 'received') {
        const [product] = await db.select().from(products).where(eq(products.id, item.productId));
        if (product) {
          const newQuantity = product.stockQuantity + (item.quantity || 0);
          await db
            .update(products)
            .set({ stockQuantity: newQuantity })
            .where(eq(products.id, item.productId));
        }
      }
    }

    return newPurchase;
  }

  async updatePurchaseStatus(id: number, status: string): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    if (!purchase) return undefined;

    const [updatedPurchase] = await db
      .update(purchases)
      .set({ status })
      .where(eq(purchases.id, id))
      .returning();

    // If status changed to received, update product quantities
    if (status === 'received' && purchase.status !== 'received') {
      const purchaseItemsList = await db
        .select()
        .from(purchaseItems)
        .where(eq(purchaseItems.purchaseId, id));

      for (const item of purchaseItemsList) {
        // Đảm bảo quantity có giá trị
        const quantity = item.quantity || 0;
        
        const [product] = await db.select().from(products).where(eq(products.id, item.productId));
        if (product) {
          const newQuantity = product.stockQuantity + quantity;
          await db
            .update(products)
            .set({ stockQuantity: newQuantity })
            .where(eq(products.id, item.productId));
        }
      }
    }

    return updatedPurchase;
  }

  async getAllPurchases(): Promise<Purchase[]> {
    return db.select().from(purchases);
  }

  async getPurchasesBySupplier(supplierId: number): Promise<Purchase[]> {
    return db
      .select()
      .from(purchases)
      .where(eq(purchases.supplierId, supplierId))
      .orderBy(desc(purchases.purchaseDate));
  }

  async getStoreSettings(): Promise<StoreSettings | undefined> {
    const settings = await db.select().from(storeSettings);
    return settings[0];
  }

  async updateStoreSettings(settings: Partial<InsertStoreSettings>): Promise<StoreSettings> {
    const existingSettings = await this.getStoreSettings();
    
    if (!existingSettings) {
      // Đảm bảo có giá trị storeName
      const settingsToInsert = {
        ...settings,
        storeName: settings.storeName || 'My Store'
      };
      
      const [newSettings] = await db.insert(storeSettings).values([settingsToInsert]).returning();
      return newSettings;
    }

    const [updatedSettings] = await db
      .update(storeSettings)
      .set(settings)
      .where(eq(storeSettings.id, existingSettings.id))
      .returning();
    return updatedSettings;
  }

  async logActivity(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  async getRecentActivity(limit: number): Promise<ActivityLog[]> {
    const logs = await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);

    // Enrich with user information
    const logsWithUser = await Promise.all(
      logs.map(async (log) => {
        if (!log.userId) return log;
        const [user] = await db.select().from(users).where(eq(users.id, log.userId));
        return {
          ...log,
          user: user ? user.fullName : undefined
        };
      })
    );

    return logsWithUser;
  }

  async logBackup(log: InsertBackupLog): Promise<BackupLog> {
    const [newLog] = await db.insert(backupLogs).values(log).returning();
    return newLog;
  }

  async getBackupLogs(): Promise<BackupLog[]> {
    return db.select().from(backupLogs).orderBy(desc(backupLogs.timestamp));
  }

  async getDashboardData(): Promise<DashboardData> {
    // Get statistics
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get total revenue for current month
    const monthlyOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          gte(orders.orderDate, startOfMonth),
          eq(orders.status, 'completed')
        )
      );
    
    const revenue = monthlyOrders.reduce((sum, order) => sum + Number(order.finalAmount), 0);
    
    // Count orders for current month
    const orderCount = monthlyOrders.length;
    
    // Count customers total (placeholder since we don't have createdAt fields yet)
    const customersResult = await db.select().from(customers);
    const newCustomersCount = customersResult.length;
    
    // Estimate profit (assume 30% of revenue is profit)
    const profit = revenue * 0.3;
    
    // Get 5 most recent orders
    const recentOrders = await this.getRecentOrders(5);
    
    // Get 10 most recent activities
    const recentActivities = await this.getRecentActivity(10);
    
    // Get low stock products
    const lowStockProducts = await this.getLowStockProducts();
    
    // Get daily sales for the past 7 days
    const salesByDay: { day: string; amount: number }[] = [];
    
    // Calculate start date (7 days ago)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6);
    
    // Initialize daily sales data
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const day = date.toISOString().split('T')[0];
      
      salesByDay.push({
        day: day,
        amount: 0
      });
    }
    
    // Get sales data from orders
    const weeklyOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          gte(orders.orderDate, startDate),
          eq(orders.status, 'completed')
        )
      );
    
    // Update daily sales data
    weeklyOrders.forEach(order => {
      const orderDay = new Date(order.orderDate).toISOString().split('T')[0];
      const salesDay = salesByDay.find(s => s.day === orderDay);
      if (salesDay) {
        salesDay.amount += Number(order.finalAmount);
      }
    });
    
    return {
      stats: {
        revenue,
        orders: orderCount,
        newCustomers: newCustomersCount,
        profit
      },
      recentOrders,
      recentActivities,
      lowStockProducts,
      salesByDay
    };
  }
}