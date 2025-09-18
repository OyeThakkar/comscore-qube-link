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
  const [orders, setOrders] = useState<any[]>([]);
  const [uploadStats, setUploadStats] = useState({
    inserted: 0,
    updated: 0,
    cancelled: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rows.push(row);
      }
    }
    return rows;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsProcessing(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsedOrders = parseCSV(text);
          
          // Count operations
          const stats = {
            inserted: parsedOrders.filter(o => o.operation?.toLowerCase() === 'insert').length,
            updated: parsedOrders.filter(o => o.operation?.toLowerCase() === 'update').length,
            cancelled: parsedOrders.filter(o => o.operation?.toLowerCase() === 'cancel').length
          };
          
          setOrders(parsedOrders);
          setUploadStats(stats);
          setIsProcessing(false);
          
          toast({
            title: "File uploaded successfully",
            description: `Processed ${file.name} - ${parsedOrders.length} orders total`,
          });
        } catch (error) {
          setIsProcessing(false);
          toast({
            title: "Error processing file",
            description: "Please check the CSV format and try again.",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.content_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.theatre_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.order_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              {isProcessing ? (
                <div className="text-sm text-muted-foreground">Processing...</div>
              ) : (
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
              )}
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
                  filteredOrders.map((order, index) => (
                    <TableRow key={order.order_id || index}>
                      <TableCell className="font-medium">{order.order_id || order.tmc_media_order_id}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.operation} />
                      </TableCell>
                      <TableCell className="font-medium">{order.content_title}</TableCell>
                      <TableCell>{order.theatre_name || order.qw_theatre_name}</TableCell>
                      <TableCell>{order.theatre_city || order.qw_theatre_city}, {order.theatre_state || order.qw_theatre_state}</TableCell>
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