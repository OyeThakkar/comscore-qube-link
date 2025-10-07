import { useState, useEffect } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Package, BarChart3, LogOut, User, Users, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import OrdersTab from "@/components/OrdersTab";
import CplManagementTab from "@/components/CplManagementTab";
import BookingManagerTab from "@/components/BookingManagerTab";
import { DistributorManagementTab } from "@/components/DistributorManagementTab";
import { UserManagementTab } from "@/components/UserManagementTab";

const Index = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || "orders");
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { role: userRole, hasPermission, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  // Update active tab when URL param changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth", { replace: true });
    } catch (error) {
      // Navigate to auth regardless of error
      navigate("/auth", { replace: true });
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Comscore Orders Management</h1>
                <p className="text-sm text-muted-foreground">Qube Wire Integration Tool</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
                {userRole && (
                  <span className="text-primary font-medium">
                    ({userRole.replace('_', ' ').toUpperCase()})
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${hasPermission(['admin', 'client_service']) ? 'grid-cols-5' : 'grid-cols-4'} mb-6`}>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Orders Management
            </TabsTrigger>
            <TabsTrigger value="cpl" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              CPL Management
            </TabsTrigger>
            <TabsTrigger value="booking" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Booking Manager
            </TabsTrigger>
            <TabsTrigger value="distributors" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Distributor Management
            </TabsTrigger>
            {hasPermission(['admin', 'client_service']) && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Management
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>
          
          <TabsContent value="cpl">
            <CplManagementTab />
          </TabsContent>
          
          <TabsContent value="booking">
            <BookingManagerTab />
          </TabsContent>

          <TabsContent value="distributors">
            <DistributorManagementTab />
          </TabsContent>

          {hasPermission(['admin', 'client_service']) && (
            <TabsContent value="users">
              <UserManagementTab />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Index;