import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, Filter, Download } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const mockOrders = [
  {
    order_id: "ORD-001",
    operation: "insert",
    content_title: "Top Gun: Maverick",
    theatre_name: "AMC Times Square",
    theatre_city: "New York",
    theatre_state: "NY",
    playdate_begin: "2024-01-15",
    playdate_end: "2024-01-21",
    booker_name: "John Smith",
    booker_email: "john.smith@amc.com",
    studio_name: "Paramount Pictures",
    delivery_method: "Digital"
  },
  {
    order_id: "ORD-002",
    operation: "update",
    content_title: "Avatar: The Way of Water",
    theatre_name: "Regal Union Square",
    theatre_city: "New York",
    theatre_state: "NY",
    playdate_begin: "2024-01-20",
    playdate_end: "2024-01-27",
    booker_name: "Sarah Johnson",
    booker_email: "sarah.j@regal.com",
    studio_name: "20th Century Studios",
    delivery_method: "Digital"
  },
  {
    order_id: "ORD-003",
    operation: "cancel",
    content_title: "Black Panther: Wakanda Forever",
    theatre_name: "Cinemark Century City",
    theatre_city: "Los Angeles",
    theatre_state: "CA",
    playdate_begin: "2024-01-25",
    playdate_end: "2024-02-01",
    booker_name: "Mike Davis",
    booker_email: "mike.davis@cinemark.com",
    studio_name: "Marvel Studios",
    delivery_method: "Digital"
  }
];

const OrdersTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStats, setUploadStats] = useState({
    inserted: 0,
    updated: 0,
    cancelled: 0
  });
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Mock processing
      setTimeout(() => {
        setUploadStats({
          inserted: 15,
          updated: 8,
          cancelled: 3
        });
        toast({
          title: "File uploaded successfully",
          description: `Processed ${file.name} - 26 orders total`,
        });
      }, 1000);
    }
  };

  const filteredOrders: any[] = [];

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="csvfile">CSV File</Label>
            <Input
              id="csvfile"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
          </div>
          
          {selectedFile && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-status-success-bg text-status-success">
                  {uploadStats.inserted} Inserted
                </Badge>
                <Badge variant="outline" className="bg-status-info-bg text-status-info">
                  {uploadStats.updated} Updated
                </Badge>
                <Badge variant="outline" className="bg-status-error-bg text-status-error">
                  {uploadStats.cancelled} Cancelled
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orders Management</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Content Title</TableHead>
                  <TableHead>Theatre</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Play Dates</TableHead>
                  <TableHead>Booker</TableHead>
                  <TableHead>Studio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No orders found. Upload a CSV file to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.order_id}>
                      <TableCell className="font-medium">{order.order_id}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.operation as any} />
                      </TableCell>
                      <TableCell className="font-medium">{order.content_title}</TableCell>
                      <TableCell>{order.theatre_name}</TableCell>
                      <TableCell>{order.theatre_city}, {order.theatre_state}</TableCell>
                      <TableCell className="text-sm">
                        {order.playdate_begin} to {order.playdate_end}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.booker_name}</p>
                          <p className="text-sm text-muted-foreground">{order.booker_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{order.studio_name}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersTab;