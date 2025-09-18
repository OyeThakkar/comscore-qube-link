import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Package, BarChart3 } from "lucide-react";
import OrdersTab from "@/components/OrdersTab";
import CplManagementTab from "@/components/CplManagementTab";
import BookingManagerTab from "@/components/BookingManagerTab";

const Index = () => {
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Comscore Orders Management</h1>
              <p className="text-sm text-muted-foreground">Qube Wire Integration Tool</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
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
        </Tabs>
      </main>
    </div>
  );
};

export default Index;