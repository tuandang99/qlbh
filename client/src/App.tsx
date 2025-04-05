import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/lib/auth.tsx";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Orders from "@/pages/orders";
import Customers from "@/pages/customers";
import Staff from "@/pages/staff";
import Suppliers from "@/pages/suppliers";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import { useEffect } from "react";

function Router() {
  const { isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && location !== "/login") {
      navigate("/login");
    }
  }, [isAuthenticated, location, navigate]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/products" component={Products} />
      <Route path="/products/new" component={Products} />
      <Route path="/products/:id" component={Products} />
      <Route path="/orders" component={Orders} />
      <Route path="/orders/new" component={Orders} />
      <Route path="/orders/:id" component={Orders} />
      <Route path="/customers" component={Customers} />
      <Route path="/customers/new" component={Customers} />
      <Route path="/customers/:id" component={Customers} />
      <Route path="/staff" component={Staff} />
      <Route path="/staff/new" component={Staff} />
      <Route path="/staff/:id" component={Staff} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/suppliers/new" component={Suppliers} />
      <Route path="/suppliers/:id" component={Suppliers} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      
      {/* Redirect home to dashboard */}
      <Route path="/">
        {() => {
          navigate("/dashboard");
          return null;
        }}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
