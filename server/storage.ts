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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private customers: Map<number, Customer>;
  private suppliers: Map<number, Supplier>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private purchases: Map<number, Purchase>;
  private purchaseItems: Map<number, PurchaseItem>;
  private storeSettings: StoreSettings | undefined;
  private activityLogs: ActivityLog[];
  private backupLogs: BackupLog[];
  
  private userIdCounter: number = 1;
  private categoryIdCounter: number = 1;
  private productIdCounter: number = 1;
  private customerIdCounter: number = 1;
  private supplierIdCounter: number = 1;
  private orderIdCounter: number = 1;
  private orderItemIdCounter: number = 1;
  private purchaseIdCounter: number = 1;
  private purchaseItemIdCounter: number = 1;
  private storeSettingsIdCounter: number = 1;
  private activityLogIdCounter: number = 1;
  private backupLogIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.customers = new Map();
    this.suppliers = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.purchases = new Map();
    this.purchaseItems = new Map();
    this.activityLogs = [];
    this.backupLogs = [];
    
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create admin user
    const adminUser: InsertUser = {
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      fullName: "Quản Trị Viên",
      email: "admin@example.com",
      role: "admin",
      active: true
    };
    this.createUser(adminUser);
    
    // Create default store settings
    const defaultSettings: InsertStoreSettings = {
      storeName: "Cửa Hàng Việt",
      address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
      phone: "028-1234-5678",
      email: "info@cuahangviet.com",
      taxRate: 10,
      currencySymbol: "đ",
      openingHours: "8:00 - 22:00"
    };
    this.storeSettings = {
      id: this.storeSettingsIdCounter++,
      ...defaultSettings
    };
    
    // Create some categories
    const categories = [
      { name: "Quần áo nam", description: "Quần, áo, và phụ kiện cho nam" },
      { name: "Quần áo nữ", description: "Quần, áo, và phụ kiện cho nữ" },
      { name: "Giày dép", description: "Giày, dép các loại" },
      { name: "Phụ kiện", description: "Túi xách, ví, thắt lưng, etc." }
    ];
    categories.forEach(cat => this.createCategory(cat));
    
    // Create some products
    const products: InsertProduct[] = [
      {
        name: "Áo thun nam size L",
        sku: "T-SHIRT-M-L-001",
        barcode: "8901234567890",
        description: "Áo thun nam cotton chất lượng cao",
        categoryId: 1,
        costPrice: 85000,
        sellingPrice: 150000,
        stockQuantity: 3,
        alertThreshold: 5
      },
      {
        name: "Quần jean nữ size 28",
        sku: "JEAN-W-28-002",
        barcode: "8902345678901",
        description: "Quần jean nữ skinny fit",
        categoryId: 2,
        costPrice: 180000,
        sellingPrice: 350000,
        stockQuantity: 8,
        alertThreshold: 5
      },
      {
        name: "Túi xách nữ da cao cấp",
        sku: "BAG-W-001",
        barcode: "8903456789012",
        description: "Túi xách nữ da thật cao cấp",
        categoryId: 4,
        costPrice: 450000,
        sellingPrice: 850000,
        stockQuantity: 25,
        alertThreshold: 5
      },
      {
        name: "Giày thể thao nam size 42",
        sku: "SHOES-M-42-003",
        barcode: "8904567890123",
        description: "Giày thể thao nam chất lượng cao",
        categoryId: 3,
        costPrice: 350000,
        sellingPrice: 650000,
        stockQuantity: 15,
        alertThreshold: 5
      }
    ];
    products.forEach(prod => this.createProduct(prod));
    
    // Create some customers
    const customers: InsertCustomer[] = [
      {
        name: "Nguyễn Thị Minh",
        phone: "0901234567",
        email: "minh@example.com",
        address: "123 Đường Nguyễn Huệ, Q1, TP.HCM",
        loyaltyPoints: 150
      },
      {
        name: "Trần Văn Long",
        phone: "0912345678",
        email: "long@example.com",
        address: "456 Đường Lê Lợi, Q1, TP.HCM",
        loyaltyPoints: 300
      },
      {
        name: "Phạm Thị Ngọc",
        phone: "0923456789",
        email: "ngoc@example.com",
        address: "789 Đường Hai Bà Trưng, Q3, TP.HCM",
        loyaltyPoints: 50
      },
      {
        name: "Lê Văn Hùng",
        phone: "0934567890",
        email: "hung@example.com",
        address: "101 Đường Võ Văn Tần, Q3, TP.HCM",
        loyaltyPoints: 120
      },
      {
        name: "Vũ Minh Tuấn",
        phone: "0945678901",
        email: "tuan@example.com",
        address: "202 Đường Điện Biên Phủ, Bình Thạnh, TP.HCM",
        loyaltyPoints: 80
      }
    ];
    customers.forEach(cust => this.createCustomer(cust));
    
    // Create some suppliers
    const suppliers: InsertSupplier[] = [
      {
        name: "Công ty TNHH Thời Trang Việt",
        contactPerson: "Nguyễn Văn An",
        phone: "0987654321",
        email: "an@thoitrangviet.com",
        address: "123 Đường Lý Tự Trọng, Q1, TP.HCM"
      },
      {
        name: "Công ty CP Phụ Kiện Thời Trang",
        contactPerson: "Trần Thị Bình",
        phone: "0976543210",
        email: "binh@phukien.com",
        address: "456 Đường Nam Kỳ Khởi Nghĩa, Q3, TP.HCM"
      }
    ];
    suppliers.forEach(sup => this.createSupplier(sup));
    
    // Create some orders
    const createMockOrder = (
      customerId: number, 
      orderNumber: string, 
      status: 'pending' | 'completed' | 'cancelled',
      date: Date,
      products: {id: number, quantity: number}[]
    ) => {
      // Create the order
      const order: InsertOrder = {
        orderNumber,
        customerId,
        userId: 1, // Admin user
        orderDate: date,
        status,
        totalAmount: 0,
        finalAmount: 0,
        paymentMethod: "cash"
      };
      
      const createdOrder = this.createOrder(order, []);
      
      // Calculate items and update order
      let totalAmount = 0;
      
      const items: InsertOrderItem[] = [];
      for (const item of products) {
        const product = this.getProduct(item.id);
        if (product) {
          const subtotal = product.sellingPrice * item.quantity;
          totalAmount += subtotal;
          
          items.push({
            orderId: createdOrder.id,
            productId: item.id,
            quantity: item.quantity,
            unitPrice: product.sellingPrice,
            subtotal
          });
        }
      }
      
      // Add items and update order totals
      items.forEach(item => {
        this.orderItems.set(this.orderItemIdCounter, {
          id: this.orderItemIdCounter++,
          ...item
        });
      });
      
      createdOrder.totalAmount = totalAmount;
      createdOrder.finalAmount = totalAmount;
      this.orders.set(createdOrder.id, createdOrder);
      
      return createdOrder;
    };
    
    // Yesterday and today's dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Create recent orders
    createMockOrder(1, "12468", "pending", new Date(today.setHours(today.getHours() - 1)), [
      { id: 1, quantity: 2 },
      { id: 3, quantity: 1 }
    ]);
    
    createMockOrder(4, "12467", "completed", new Date(today.setHours(today.getHours() - 3)), [
      { id: 2, quantity: 1 },
      { id: 4, quantity: 1 }
    ]);
    
    createMockOrder(2, "12466", "completed", new Date(today.setHours(today.getHours() - 5)), [
      { id: 3, quantity: 2 },
      { id: 4, quantity: 1 }
    ]);
    
    createMockOrder(3, "12465", "completed", new Date(today.setHours(today.getHours() - 8)), [
      { id: 1, quantity: 1 },
      { id: 2, quantity: 1 }
    ]);
    
    createMockOrder(5, "12464", "cancelled", yesterday, [
      { id: 3, quantity: 2 },
      { id: 4, quantity: 1 }
    ]);
    
    // Create activity logs
    const activityData = [
      {
        userId: 1,
        action: "Đơn hàng mới",
        details: "Đơn hàng #12468 được tạo bởi admin",
        timestamp: new Date(today.setMinutes(today.getMinutes() - 15))
      },
      {
        userId: 1,
        action: "Cảnh báo tồn kho",
        details: "Sản phẩm: Áo thun nam size L sắp hết hàng (còn 3)",
        timestamp: new Date(today.setMinutes(today.getMinutes() - 45))
      },
      {
        userId: 1,
        action: "Đơn hàng hoàn thành",
        details: "Đơn hàng #12466 đã được hoàn thành",
        timestamp: new Date(today.setHours(today.getHours() - 1))
      },
      {
        userId: 1,
        action: "Khách hàng mới",
        details: "Khách hàng Phạm Thị Ngọc đã được thêm vào hệ thống",
        timestamp: new Date(today.setHours(today.getHours() - 3))
      }
    ];
    
    activityData.forEach(log => this.logActivity(log));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) return undefined;
    
    const updatedCategory = { ...existingCategory, ...category };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }
  
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.sku === sku
    );
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.barcode === barcode
    );
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const newProduct: Product = { ...product, id };
    this.products.set(id, newProduct);
    return newProduct;
  }
  
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;
    
    const updatedProduct = { ...existingProduct, ...product };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
  
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async getLowStockProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.stockQuantity <= (product.alertThreshold || 5)
    );
  }
  
  async searchProducts(query: string): Promise<Product[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(
      product => 
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.sku.toLowerCase().includes(lowercaseQuery) ||
        (product.barcode && product.barcode.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Customer methods
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = this.customerIdCounter++;
    const newCustomer: Customer = { ...customer, id };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }
  
  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existingCustomer = this.customers.get(id);
    if (!existingCustomer) return undefined;
    
    const updatedCustomer = { ...existingCustomer, ...customer };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  
  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }
  
  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }
  
  async searchCustomers(query: string): Promise<Customer[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.customers.values()).filter(
      customer => 
        customer.name.toLowerCase().includes(lowercaseQuery) ||
        (customer.phone && customer.phone.includes(query)) ||
        (customer.email && customer.email.toLowerCase().includes(lowercaseQuery))
    );
  }
  
  async updateCustomerLoyalty(id: number, points: number): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    
    const updatedCustomer = { 
      ...customer, 
      loyaltyPoints: (customer.loyaltyPoints || 0) + points 
    };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  // Supplier methods
  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const id = this.supplierIdCounter++;
    const newSupplier: Supplier = { ...supplier, id };
    this.suppliers.set(id, newSupplier);
    return newSupplier;
  }
  
  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const existingSupplier = this.suppliers.get(id);
    if (!existingSupplier) return undefined;
    
    const updatedSupplier = { ...existingSupplier, ...supplier };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }
  
  async deleteSupplier(id: number): Promise<boolean> {
    return this.suppliers.delete(id);
  }
  
  async getAllSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderWithDetails(id: number): Promise<OrderWithDetails | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const customer = order.customerId ? await this.getCustomer(order.customerId) : null;
    const user = await this.getUser(order.userId) as User;
    
    const items = Array.from(this.orderItems.values())
      .filter(item => item.orderId === id)
      .map(item => {
        const product = this.products.get(item.productId) as Product;
        return { ...item, product };
      });
    
    return { ...order, customer, items, user };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    // Create the order first
    const id = this.orderIdCounter++;
    const newOrder: Order = { ...order, id };
    this.orders.set(id, newOrder);
    
    // Then add the items if provided
    if (items.length > 0) {
      let totalAmount = 0;
      
      for (const item of items) {
        const orderId = newOrder.id;
        const itemId = this.orderItemIdCounter++;
        
        const product = await this.getProduct(item.productId);
        if (!product) continue;
        
        const unitPrice = item.unitPrice || product.sellingPrice;
        const quantity = item.quantity || 1;
        const subtotal = unitPrice * quantity;
        
        totalAmount += subtotal;
        
        const orderItem: OrderItem = {
          id: itemId,
          orderId,
          productId: item.productId,
          quantity,
          unitPrice,
          subtotal
        };
        
        this.orderItems.set(itemId, orderItem);
        
        // Update product stock
        const updatedProduct = { 
          ...product, 
          stockQuantity: product.stockQuantity - quantity 
        };
        this.products.set(product.id, updatedProduct);
      }
      
      // Update order totals
      newOrder.totalAmount = totalAmount;
      newOrder.finalAmount = totalAmount - (newOrder.discount || 0);
      this.orders.set(id, newOrder);
      
      // Update customer loyalty points for completed orders
      if (newOrder.status === 'completed' && newOrder.customerId) {
        const loyaltyPoints = Math.floor(newOrder.finalAmount / 10000); // 1 point per 10,000 VND
        this.updateCustomerLoyalty(newOrder.customerId, loyaltyPoints);
      }
    }
    
    return newOrder;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    
    // If status changed to completed, add loyalty points
    if (status === 'completed' && order.status !== 'completed' && order.customerId) {
      const loyaltyPoints = Math.floor(order.finalAmount / 10000);
      this.updateCustomerLoyalty(order.customerId, loyaltyPoints);
    }
    
    // If status changed to cancelled and it was pending, restore stock
    if (status === 'cancelled' && order.status === 'pending') {
      const items = await this.getOrderItems(id);
      for (const item of items) {
        const product = await this.getProduct(item.productId);
        if (product) {
          const updatedProduct = {
            ...product,
            stockQuantity: product.stockQuantity + item.quantity
          };
          this.products.set(product.id, updatedProduct);
        }
      }
    }
    
    return updatedOrder;
  }
  
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async getRecentOrders(limit: number): Promise<OrderWithDetails[]> {
    const orders = Array.from(this.orders.values())
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, limit);
    
    const result: OrderWithDetails[] = [];
    
    for (const order of orders) {
      const customer = order.customerId ? await this.getCustomer(order.customerId) : null;
      const user = await this.getUser(order.userId) as User;
      
      const items = Array.from(this.orderItems.values())
        .filter(item => item.orderId === order.id)
        .map(item => {
          const product = this.products.get(item.productId) as Product;
          return { ...item, product };
        });
      
      result.push({ ...order, customer, items, user });
    }
    
    return result;
  }
  
  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      order => order.customerId === customerId
    );
  }
  
  // Order Item methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      item => item.orderId === orderId
    );
  }
  
  // Purchase methods
  async getPurchase(id: number): Promise<Purchase | undefined> {
    return this.purchases.get(id);
  }

  async createPurchase(purchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<Purchase> {
    const id = this.purchaseIdCounter++;
    const newPurchase: Purchase = { ...purchase, id };
    this.purchases.set(id, newPurchase);
    
    // Process items if provided
    if (items.length > 0) {
      let totalAmount = 0;
      
      for (const item of items) {
        const purchaseId = newPurchase.id;
        const itemId = this.purchaseItemIdCounter++;
        
        const product = await this.getProduct(item.productId);
        if (!product) continue;
        
        const unitCost = item.unitCost || product.costPrice;
        const quantity = item.quantity || 1;
        const subtotal = unitCost * quantity;
        
        totalAmount += subtotal;
        
        const purchaseItem: PurchaseItem = {
          id: itemId,
          purchaseId,
          productId: item.productId,
          quantity,
          unitCost,
          subtotal
        };
        
        this.purchaseItems.set(itemId, purchaseItem);
        
        // Update product cost price and stock if received
        if (purchase.status === 'received') {
          const updatedProduct = { 
            ...product, 
            costPrice: unitCost, // Update to latest cost
            stockQuantity: product.stockQuantity + quantity 
          };
          this.products.set(product.id, updatedProduct);
        }
      }
      
      // Update purchase total
      newPurchase.totalAmount = totalAmount;
      this.purchases.set(id, newPurchase);
    }
    
    return newPurchase;
  }
  
  async updatePurchaseStatus(id: number, status: string): Promise<Purchase | undefined> {
    const purchase = this.purchases.get(id);
    if (!purchase) return undefined;
    
    const updatedPurchase = { ...purchase, status };
    this.purchases.set(id, updatedPurchase);
    
    // If status changed to received, update stock
    if (status === 'received' && purchase.status !== 'received') {
      const items = Array.from(this.purchaseItems.values()).filter(
        item => item.purchaseId === id
      );
      
      for (const item of items) {
        const product = await this.getProduct(item.productId);
        if (product) {
          const updatedProduct = {
            ...product,
            costPrice: item.unitCost, // Update to latest cost
            stockQuantity: product.stockQuantity + item.quantity
          };
          this.products.set(product.id, updatedProduct);
        }
      }
    }
    
    return updatedPurchase;
  }
  
  async getAllPurchases(): Promise<Purchase[]> {
    return Array.from(this.purchases.values());
  }
  
  async getPurchasesBySupplier(supplierId: number): Promise<Purchase[]> {
    return Array.from(this.purchases.values()).filter(
      purchase => purchase.supplierId === supplierId
    );
  }
  
  // Store Settings methods
  async getStoreSettings(): Promise<StoreSettings | undefined> {
    return this.storeSettings;
  }

  async updateStoreSettings(settings: Partial<InsertStoreSettings>): Promise<StoreSettings> {
    if (!this.storeSettings) {
      const id = this.storeSettingsIdCounter++;
      this.storeSettings = {
        id,
        storeName: settings.storeName || "Cửa Hàng Việt",
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        taxRate: settings.taxRate || 0,
        currencySymbol: settings.currencySymbol || "đ",
        openingHours: settings.openingHours
      };
    } else {
      this.storeSettings = { ...this.storeSettings, ...settings };
    }
    
    return this.storeSettings;
  }
  
  // Activity Log methods
  async logActivity(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const newLog: ActivityLog = { 
      ...log, 
      id,
      timestamp: log.timestamp || new Date() 
    };
    
    this.activityLogs.unshift(newLog); // Add to beginning for chronological order
    return newLog;
  }

  async getRecentActivity(limit: number): Promise<ActivityLog[]> {
    return this.activityLogs.slice(0, limit);
  }
  
  // Backup Log methods
  async logBackup(log: InsertBackupLog): Promise<BackupLog> {
    const id = this.backupLogIdCounter++;
    const newLog: BackupLog = { 
      ...log, 
      id,
      timestamp: log.timestamp || new Date() 
    };
    
    this.backupLogs.unshift(newLog); // Add to beginning for chronological order
    return newLog;
  }

  async getBackupLogs(): Promise<BackupLog[]> {
    return this.backupLogs;
  }
  
  // Dashboard methods
  async getDashboardData(): Promise<DashboardData> {
    // Get orders from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const orders = Array.from(this.orders.values());
    const todayOrders = orders.filter(order => 
      new Date(order.orderDate).getTime() >= today.getTime()
    );
    
    // Calculate today's stats
    const revenue = todayOrders.reduce((sum, order) => 
      order.status !== 'cancelled' ? sum + order.finalAmount : sum, 0
    );
    
    const ordersCount = todayOrders.filter(
      order => order.status !== 'cancelled'
    ).length;
    
    // Get customer IDs from today's orders
    const todayCustomerIds = new Set(
      todayOrders.map(order => order.customerId).filter(Boolean)
    );
    
    // Get products with low stock
    const lowStockProducts = await this.getLowStockProducts();
    
    // Create sales data for the last 7 days
    const salesByDay: { day: string; amount: number }[] = [];
    const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= date && orderDate < nextDate && order.status !== 'cancelled';
      });
      
      const dayAmount = dayOrders.reduce(
        (sum, order) => sum + order.finalAmount, 0
      );
      
      const dayIndex = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
      
      salesByDay.push({
        day: dayLabels[dayIndex],
        amount: dayAmount
      });
    }
    
    // Calculate profit (simple estimate: 30% of revenue)
    const profit = revenue * 0.3;
    
    // Count new customers (those created today)
    const customers = Array.from(this.customers.values());
    const newCustomers = customers.filter(customer => {
      // Since we don't have createdAt, let's count customers that appeared in today's orders
      return todayCustomerIds.has(customer.id);
    }).length;
    
    // Recent activities and orders
    const recentActivities = await this.getRecentActivity(4);
    const recentOrders = await this.getRecentOrders(5);
    
    return {
      stats: {
        revenue,
        orders: ordersCount,
        newCustomers,
        profit
      },
      recentOrders,
      recentActivities,
      lowStockProducts,
      salesByDay
    };
  }
}

export const storage = new MemStorage();
