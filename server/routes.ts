import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema, insertUserSchema, insertProductSchema, insertCategorySchema,
  insertCustomerSchema, insertSupplierSchema, insertOrderSchema, insertOrderItemSchema,
  insertPurchaseSchema, insertPurchaseItemSchema, insertStoreSettingsSchema,
  insertActivityLogSchema, insertBackupLogSchema
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import jwt from "jsonwebtoken";
import express from "express";
import bcrypt from "bcrypt";

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT
const authenticateToken = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden: Invalid token" });
  }
};

// Middleware to check user role
const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    
    if (roles.includes(user.role)) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
  };
};

// Error handling for Zod validation
const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: Function) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(400).json({ message: "Invalid request body" });
      }
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup JSON body parsing
  app.use(express.json());

  // API routes - all prefixed with /api
  
  // Auth routes
  app.post("/api/login", validateBody(loginSchema), async (req, res) => {
    const { username, password } = req.body;
    
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Verify password with bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      if (!user.active) {
        return res.status(403).json({ message: "Account is inactive" });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Log activity
      await storage.logActivity({
        userId: user.id,
        action: "Login",
        details: `User ${user.username} logged in`,
        timestamp: new Date()
      });
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard route
  app.get("/api/dashboard", authenticateToken, async (_req, res) => {
    try {
      const dashboardData = await storage.getDashboardData();
      res.json(dashboardData);
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Error fetching dashboard data" });
    }
  });

  // User routes
  app.get("/api/users", authenticateToken, checkRole(["admin"]), async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, password: undefined }))); // Remove passwords
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.post("/api/users", authenticateToken, checkRole(["admin"]), validateBody(insertUserSchema), async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      // Hash password before creating user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      
      const userData = {
        ...req.body,
        password: hashedPassword,
        role: req.body.role || "staff", // Default role
        active: req.body.active !== undefined ? req.body.active : true // Default active
      };
      
      const newUser = await storage.createUser(userData);
      
      // Log activity
      await storage.logActivity({
        userId: (req as any).user.id,
        action: "User created",
        details: `User ${newUser.username} was created`,
        timestamp: new Date()
      });
      
      res.status(201).json({ ...newUser, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.put("/api/users/:id", authenticateToken, checkRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // If username is being changed, check if it already exists
      if (req.body.username && req.body.username !== existingUser.username) {
        const usernameExists = await storage.getUserByUsername(req.body.username);
        if (usernameExists) {
          return res.status(409).json({ message: "Username already exists" });
        }
      }
      
      // If password is being changed, hash it
      let userData = { ...req.body };
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(req.body.password, salt);
      }
      
      const updatedUser = await storage.updateUser(id, userData);
      
      // Log activity
      await storage.logActivity({
        userId: (req as any).user.id,
        action: "User updated",
        details: `User ${existingUser.username} was updated`,
        timestamp: new Date()
      });
      
      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, checkRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't allow deleting self
      if (id === (req as any).user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(id);
      
      if (success) {
        // Log activity
        await storage.logActivity({
          userId: (req as any).user.id,
          action: "User deleted",
          details: `User ${user.username} was deleted`,
          timestamp: new Date()
        });
        
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(500).json({ message: "Error deleting user" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  // Category routes
  app.get("/api/categories", authenticateToken, async (_req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  app.post("/api/categories", authenticateToken, validateBody(insertCategorySchema), async (req, res) => {
    try {
      const newCategory = await storage.createCategory(req.body);
      
      // Log activity
      await storage.logActivity({
        userId: (req as any).user.id,
        action: "Category created",
        details: `Category ${newCategory.name} was created`,
        timestamp: new Date()
      });
      
      res.status(201).json(newCategory);
    } catch (error) {
      res.status(500).json({ message: "Error creating category" });
    }
  });

  app.put("/api/categories/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingCategory = await storage.getCategory(id);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const updatedCategory = await storage.updateCategory(id, req.body);
      
      // Log activity
      await storage.logActivity({
        userId: (req as any).user.id,
        action: "Category updated",
        details: `Category ${existingCategory.name} was updated`,
        timestamp: new Date()
      });
      
      res.json(updatedCategory);
    } catch (error) {
      res.status(500).json({ message: "Error updating category" });
    }
  });

  app.delete("/api/categories/:id", authenticateToken, checkRole(["admin", "manager"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const success = await storage.deleteCategory(id);
      
      if (success) {
        // Log activity
        await storage.logActivity({
          userId: (req as any).user.id,
          action: "Category deleted",
          details: `Category ${category.name} was deleted`,
          timestamp: new Date()
        });
        
        res.json({ message: "Category deleted successfully" });
      } else {
        res.status(500).json({ message: "Error deleting category" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error deleting category" });
    }
  });

  // Product routes
  app.get("/api/products", authenticateToken, async (_req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/low-stock", authenticateToken, async (_req, res) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching low stock products" });
    }
  });

  app.get("/api/products/search", authenticateToken, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error searching products" });
    }
  });

  app.post("/api/products", authenticateToken, validateBody(insertProductSchema), async (req, res) => {
    try {
      // Check if SKU already exists
      if (req.body.sku) {
        const existingProduct = await storage.getProductBySku(req.body.sku);
        if (existingProduct) {
          return res.status(409).json({ message: "Product with this SKU already exists" });
        }
      }
      
      // Check if barcode already exists
      if (req.body.barcode) {
        const existingProduct = await storage.getProductByBarcode(req.body.barcode);
        if (existingProduct) {
          return res.status(409).json({ message: "Product with this barcode already exists" });
        }
      }
      
      const newProduct = await storage.createProduct(req.body);
      
      // Log activity
      await storage.logActivity({
        userId: (req as any).user.id,
        action: "Product created",
        details: `Product ${newProduct.name} was created`,
        timestamp: new Date()
      });
      
      res.status(201).json(newProduct);
    } catch (error) {
      res.status(500).json({ message: "Error creating product" });
    }
  });

  app.put("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingProduct = await storage.getProduct(id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // If SKU is being changed, check if it already exists
      if (req.body.sku && req.body.sku !== existingProduct.sku) {
        const skuExists = await storage.getProductBySku(req.body.sku);
        if (skuExists) {
          return res.status(409).json({ message: "Product with this SKU already exists" });
        }
      }
      
      // If barcode is being changed, check if it already exists
      if (req.body.barcode && req.body.barcode !== existingProduct.barcode) {
        const barcodeExists = await storage.getProductByBarcode(req.body.barcode);
        if (barcodeExists) {
          return res.status(409).json({ message: "Product with this barcode already exists" });
        }
      }
      
      const updatedProduct = await storage.updateProduct(id, req.body);
      
      // Log activity
      await storage.logActivity({
        userId: (req as any).user.id,
        action: "Product updated",
        details: `Product ${existingProduct.name} was updated`,
        timestamp: new Date()
      });
      
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Error updating product" });
    }
  });

  app.delete("/api/products/:id", authenticateToken, checkRole(["admin", "manager"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const success = await storage.deleteProduct(id);
      
      if (success) {
        // Log activity
        await storage.logActivity({
          userId: (req as any).user.id,
          action: "Product deleted",
          details: `Product ${product.name} was deleted`,
          timestamp: new Date()
        });
        
        res.json({ message: "Product deleted successfully" });
      } else {
        res.status(500).json({ message: "Error deleting product" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error deleting product" });
    }
  });

  // Customer routes
  app.get("/api/customers", authenticateToken, async (_req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching customers" });
    }
  });

  app.get("/api/customers/search", authenticateToken, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const customers = await storage.searchCustomers(query);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Error searching customers" });
    }
  });

  app.post("/api/customers", authenticateToken, validateBody(insertCustomerSchema), async (req, res) => {
    try {
      const newCustomer = await storage.createCustomer(req.body);
      
      // Log activity
      await storage.logActivity({
        userId: (req as any).user.id,
        action: "Customer created",
        details: `Customer ${newCustomer.name} was created`,
        timestamp: new Date()
      });
      
      res.status(201).json(newCustomer);
    } catch (error) {
      res.status(500).json({ message: "Error creating customer" });
    }
  });

  app.put("/api/customers/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingCustomer = await storage.getCustomer(id);
      if (!existingCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const updatedCustomer = await storage.updateCustomer(id, req.body);
      
      // Log activity
      await storage.logActivity({
        userId: (req as any).user.id,
        action: "Customer updated",
        details: `Customer ${existingCustomer.name} was updated`,
        timestamp: new Date()
      });
      
      res.json(updatedCustomer);
    } catch (error) {
      res.status(500).json({ message: "Error updating customer" });
    }
  });

  app.delete("/api/customers/:id", authenticateToken, checkRole(["admin", "manager"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const success = await storage.deleteCustomer(id);
      
      if (success) {
        // Log activity
        await storage.logActivity({
          userId: (req as any).user.id,
          action: "Customer deleted",
          details: `Customer ${customer.name} was deleted`,
          timestamp: new Date()
        });
        
        res.json({ message: "Customer deleted successfully" });
      } else {
        res.status(500).json({ message: "Error deleting customer" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error deleting customer" });
    }
  });

  app.get("/api/customers/:id/orders", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const orders = await storage.getOrdersByCustomer(id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching customer orders" });
    }
  });

  // Supplier routes
  app.get("/api/suppliers", authenticateToken, async (_req, res) => {
    try {
      const suppliers = await storage.getAllSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching suppliers" });
    }
  });

  app.post("/api/suppliers", authenticateToken, validateBody(insertSupplierSchema), async (req, res) => {
    try {
      const newSupplier = await storage.createSupplier(req.body);
      
      // Log activity
      await storage.logActivity({
        userId: (req as any).user.id,
        action: "Supplier created",
        details: `Supplier ${newSupplier.name} was created`,
        timestamp: new Date()
      });
      
      res.status(201).json(newSupplier);
    } catch (error) {
      res.status(500).json({ message: "Error creating supplier" });
    }
  });

  app.put("/api/suppliers/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingSupplier = await storage.getSupplier(id);
      if (!existingSupplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      const updatedSupplier = await storage.updateSupplier(id, req.body);
      
      // Log activity
      await storage.logActivity({
        userId: (req as any).user.id,
        action: "Supplier updated",
        details: `Supplier ${existingSupplier.name} was updated`,
        timestamp: new Date()
      });
      
      res.json(updatedSupplier);
    } catch (error) {
      res.status(500).json({ message: "Error updating supplier" });
    }
  });

  app.delete("/api/suppliers/:id", authenticateToken, checkRole(["admin", "manager"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      const success = await storage.deleteSupplier(id);
      
      if (success) {
        // Log activity
        await storage.logActivity({
          userId: (req as any).user.id,
          action: "Supplier deleted",
          details: `Supplier ${supplier.name} was deleted`,
          timestamp: new Date()
        });
        
        res.json({ message: "Supplier deleted successfully" });
      } else {
        res.status(500).json({ message: "Error deleting supplier" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error deleting supplier" });
    }
  });

  app.get("/api/suppliers/:id/purchases", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      const purchases = await storage.getPurchasesBySupplier(id);
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Error fetching supplier purchases" });
    }
  });

  // Order routes
  app.get("/api/orders", authenticateToken, async (_req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  app.get("/api/orders/recent", authenticateToken, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const orders = await storage.getRecentOrders(limit);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent orders" });
    }
  });

  app.get("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderWithDetails(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Error fetching order" });
    }
  });

  app.post("/api/orders", authenticateToken, async (req, res) => {
    try {
      console.log("Received order request:", JSON.stringify(req.body));
      
      // Validate main order
      const orderData = insertOrderSchema.parse(req.body.order);
      console.log("Order data parsed:", JSON.stringify(orderData));
      
      // Validate order items
      if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
        return res.status(400).json({ message: "Order must have at least one item" });
      }
      
      console.log("Order items:", JSON.stringify(req.body.items));
      
      // Add current user to order
      orderData.userId = (req as any).user.id;
      
      // Generate order number
      const date = new Date();
      const timestamp = date.getTime().toString().slice(-5);
      orderData.orderNumber = `ORD-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${timestamp}`;
      
      // Create the order with items
      console.log("Creating order:", JSON.stringify(orderData));
      const newOrder = await storage.createOrder(orderData, req.body.items);
      console.log("Order created successfully:", JSON.stringify(newOrder));
      
      // Log activity
      await storage.logActivity({
        userId: (req as any).user.id,
        action: "Order created",
        details: `Order #${newOrder.orderNumber} was created`,
        timestamp: new Date()
      });
      
      res.status(201).json(newOrder);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        console.error("Validation error:", validationError.message);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Order creation error:", error);
        res.status(500).json({ message: "Error creating order", error: String(error) });
      }
    }
  });

  app.put("/api/orders/:id/status", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be pending, completed, or cancelled" });
      }
      
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(id, status);
      
      // Log activity
      await storage.logActivity({
        userId: (req as any).user.id,
        action: "Order status updated",
        details: `Order #${order.orderNumber} status changed to ${status}`,
        timestamp: new Date()
      });
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Error updating order status" });
    }
  });

  // Purchase routes
  app.get("/api/purchases", authenticateToken, async (_req, res) => {
    try {
      const purchases = await storage.getAllPurchases();
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Error fetching purchases" });
    }
  });

  app.post("/api/purchases", authenticateToken, checkRole(["admin", "manager"]), async (req, res) => {
    try {
      // Validate main purchase
      const purchaseData = insertPurchaseSchema.parse(req.body.purchase);
      
      // Validate purchase items
      if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
        return res.status(400).json({ message: "Purchase must have at least one item" });
      }
      
      // Add current user to purchase
      purchaseData.userId = (req as any).user.id;
      
      // Generate purchase number
      const date = new Date();
      const timestamp = date.getTime().toString().slice(-5);
      purchaseData.purchaseNumber = `PUR-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${timestamp}`;
      
      // Create the purchase with items
      const newPurchase = await storage.createPurchase(purchaseData, req.body.items);
      
      // Log activity
      await storage.logActivity({
        userId: (req as any).user.id,
        action: "Purchase created",
        details: `Purchase #${newPurchase.purchaseNumber} was created`,
        timestamp: new Date()
      });
      
      res.status(201).json(newPurchase);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Error creating purchase" });
      }
    }
  });

  app.put("/api/purchases/:id/status", authenticateToken, checkRole(["admin", "manager"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['pending', 'received', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be pending, received, or cancelled" });
      }
      
      const purchase = await storage.getPurchase(id);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      
      const updatedPurchase = await storage.updatePurchaseStatus(id, status);
      
      // Log activity
      await storage.logActivity({
        userId: (req as any).user.id,
        action: "Purchase status updated",
        details: `Purchase #${purchase.purchaseNumber} status changed to ${status}`,
        timestamp: new Date()
      });
      
      res.json(updatedPurchase);
    } catch (error) {
      res.status(500).json({ message: "Error updating purchase status" });
    }
  });

  // Store Settings routes
  app.get("/api/settings", authenticateToken, async (_req, res) => {
    try {
      const settings = await storage.getStoreSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching store settings" });
    }
  });

  app.put("/api/settings", authenticateToken, checkRole(["admin"]), validateBody(insertStoreSettingsSchema), async (req, res) => {
    try {
      const updatedSettings = await storage.updateStoreSettings(req.body);
      
      // Log activity
      await storage.logActivity({
        userId: (req as any).user.id,
        action: "Settings updated",
        details: "Store settings were updated",
        timestamp: new Date()
      });
      
      res.json(updatedSettings);
    } catch (error) {
      res.status(500).json({ message: "Error updating store settings" });
    }
  });

  // Activity Log routes
  app.get("/api/activity-logs", authenticateToken, checkRole(["admin", "manager"]), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const logs = await storage.getRecentActivity(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching activity logs" });
    }
  });

  // Backup routes
  app.post("/api/backup", authenticateToken, checkRole(["admin"]), async (req, res) => {
    try {
      const { filename, type } = req.body;
      
      if (!filename || !type || !['backup', 'restore'].includes(type)) {
        return res.status(400).json({ message: "Invalid backup details" });
      }
      
      // Log the backup operation
      const backupLog = await storage.logBackup({
        userId: (req as any).user.id,
        filename,
        type,
        success: true,
        notes: req.body.notes || "",
        timestamp: new Date()
      });
      
      // Log activity
      await storage.logActivity({
        userId: (req as any).user.id,
        action: type === 'backup' ? "Backup created" : "Backup restored",
        details: `${type === 'backup' ? 'Backup' : 'Restore'} operation: ${filename}`,
        timestamp: new Date()
      });
      
      res.json({ message: `${type === 'backup' ? 'Backup' : 'Restore'} operation completed successfully`, backupLog });
    } catch (error) {
      res.status(500).json({ message: `Error during ${req.body.type || 'backup'} operation` });
    }
  });

  app.get("/api/backups", authenticateToken, checkRole(["admin"]), async (_req, res) => {
    try {
      const backups = await storage.getBackupLogs();
      res.json(backups);
    } catch (error) {
      res.status(500).json({ message: "Error fetching backup logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
