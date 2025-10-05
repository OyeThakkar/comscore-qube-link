import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, Filter, Download } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

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
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load existing orders on component mount
  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error loading orders:', error);
        toast({
          title: "Error loading orders",
          description: "Could not load existing orders from database.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [user, toast]);

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = parseCSVLine(lines[0]);
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = parseCSVLine(lines[i]);
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rows.push(row);
      }
    }
    return rows;
  };

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Handle escaped quotes
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator outside quotes
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);
    
    const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const parsedOrders = parseCSV(text);

          // Limit number of rows
          const MAX_ROWS = 1000;
          if (parsedOrders.length > MAX_ROWS) {
            throw new Error(`Too many rows. Maximum ${MAX_ROWS} rows allowed per upload.`);
          }

          // Validate CSV data with zod
          const orderSchema = z.object({
            content_title: z.string().max(500).optional(),
            booker_email: z.string().email().max(255).optional().or(z.literal('')),
            theatre_name: z.string().max(500).optional(),
            qw_theatre_name: z.string().max(500).optional(),
            operation: z.string().max(50).optional(),
          });

          // Validate each row
          for (let i = 0; i < parsedOrders.length; i++) {
            try {
              const row = parsedOrders[i];
              // Only validate non-empty email fields
              if (row.booker_email && row.booker_email.trim()) {
                orderSchema.parse(row);
              } else {
                // Validate without email requirement
                orderSchema.omit({ booker_email: true }).parse(row);
              }
            } catch (validationError: any) {
              throw new Error(`Row ${i + 2}: ${validationError.message}`);
            }
          }
          
          // Count operations (normalize whitespace/casing)
          const normalizeOp = (op: any) => (op ?? '').toString().trim().toLowerCase();
          const stats = {
            inserted: parsedOrders.filter(o => normalizeOp(o.operation) === 'insert').length,
            updated: parsedOrders.filter(o => normalizeOp(o.operation) === 'update').length,
            cancelled: parsedOrders.filter(o => normalizeOp(o.operation) === 'cancel').length,
          };

          // Save orders to Supabase
          const allowedKeys = [
            'playdate_end','playdate_begin','tmc_media_order_id','tmc_theatre_id','note','screening_screen_no','screening_time','do_not_ship','ship_hold_type','delivery_method','return_method','is_no_key','booker_name','booker_phone','booker_email','content_id','content_title','package_uuid','film_id','theatre_id','theatre_name','chain_name','theatre_address1','theatre_city','theatre_state','theatre_postal_code','theatre_country','qw_identifier','qw_theatre_id','qw_theatre_name','qw_theatre_city','qw_theatre_state','qw_theatre_country','studio_name','qw_company_id','qw_company_name','studio_id','order_id','media_type','cancel_flag','operation','hold_key_flag'
          ] as const;

          const ordersToInsert = parsedOrders.map((order) => {
            const cleaned: any = { user_id: user.id };
            allowedKeys.forEach((key) => {
              const value = order[key as keyof typeof order];
              if (key === 'playdate_begin' || key === 'playdate_end') {
                try {
                  cleaned[key] = value ? new Date(value).toISOString().split('T')[0] : null;
                } catch {
                  cleaned[key] = null;
                }
              } else if (typeof value === 'string') {
                // Sanitize string values
                cleaned[key] = value.trim().substring(0, 1000);
              } else if (value !== undefined) {
                cleaned[key] = value;
              } else {
                cleaned[key] = null;
              }
            });
            return cleaned;
          });

          const { data, error } = await supabase
            .from('orders')
            .insert(ordersToInsert)
            .select();

          if (error) throw error;
          
          // Reload orders from database to show updated data
          const { data: allOrders, error: loadError } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

          if (loadError) throw loadError;
          
          setOrders(allOrders || []);
          setUploadStats(stats);
          setIsProcessing(false);
          
          toast({
            title: "File uploaded successfully",
            description: `Processed ${file.name} - ${parsedOrders.length} orders saved to database`,
          });
        } catch (error: any) {
          setIsProcessing(false);
          console.error('Error processing file:', error);
          toast({
            title: "Error processing file",
            description: error?.message ?? 'Unexpected error. Please ensure you are signed in and the CSV headers match the expected schema.',
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
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
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Order ID</TableHead>
                  <TableHead className="whitespace-nowrap">Media Type</TableHead>
                  <TableHead className="whitespace-nowrap">Cancel Flag</TableHead>
                  <TableHead className="whitespace-nowrap">Operation</TableHead>
                  <TableHead className="whitespace-nowrap">Play Date Begin</TableHead>
                  <TableHead className="whitespace-nowrap">Play Date End</TableHead>
                  <TableHead className="whitespace-nowrap">Hold Key Flag</TableHead>
                  <TableHead className="whitespace-nowrap">TMC Media Order ID</TableHead>
                  <TableHead className="whitespace-nowrap">TMC Theatre ID</TableHead>
                  <TableHead className="whitespace-nowrap">Note</TableHead>
                  <TableHead className="whitespace-nowrap">Screen No</TableHead>
                  <TableHead className="whitespace-nowrap">Screening Time</TableHead>
                  <TableHead className="whitespace-nowrap">Do Not Ship</TableHead>
                  <TableHead className="whitespace-nowrap">Ship Hold Type</TableHead>
                  <TableHead className="whitespace-nowrap">Delivery Method</TableHead>
                  <TableHead className="whitespace-nowrap">Return Method</TableHead>
                  <TableHead className="whitespace-nowrap">Is No Key</TableHead>
                  <TableHead className="whitespace-nowrap">Booker Name</TableHead>
                  <TableHead className="whitespace-nowrap">Booker Phone</TableHead>
                  <TableHead className="whitespace-nowrap">Booker Email</TableHead>
                  <TableHead className="whitespace-nowrap">Content ID</TableHead>
                  <TableHead className="whitespace-nowrap">Content Title</TableHead>
                  <TableHead className="whitespace-nowrap">Package UUID</TableHead>
                  <TableHead className="whitespace-nowrap">Film ID</TableHead>
                  <TableHead className="whitespace-nowrap">Theatre ID</TableHead>
                  <TableHead className="whitespace-nowrap">Theatre Name</TableHead>
                  <TableHead className="whitespace-nowrap">Chain Name</TableHead>
                  <TableHead className="whitespace-nowrap">Theatre Address</TableHead>
                  <TableHead className="whitespace-nowrap">Theatre City</TableHead>
                  <TableHead className="whitespace-nowrap">Theatre State</TableHead>
                  <TableHead className="whitespace-nowrap">Theatre Postal Code</TableHead>
                  <TableHead className="whitespace-nowrap">Theatre Country</TableHead>
                  <TableHead className="whitespace-nowrap">QW Identifier</TableHead>
                  <TableHead className="whitespace-nowrap">QW Theatre ID</TableHead>
                  <TableHead className="whitespace-nowrap">QW Theatre Name</TableHead>
                  <TableHead className="whitespace-nowrap">QW Theatre City</TableHead>
                  <TableHead className="whitespace-nowrap">QW Theatre State</TableHead>
                  <TableHead className="whitespace-nowrap">QW Theatre Country</TableHead>
                  <TableHead className="whitespace-nowrap">Studio ID</TableHead>
                  <TableHead className="whitespace-nowrap">Studio Name</TableHead>
                  <TableHead className="whitespace-nowrap">QW Company ID</TableHead>
                  <TableHead className="whitespace-nowrap">QW Company Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={42} className="text-center py-8 text-muted-foreground">
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={42} className="text-center py-8 text-muted-foreground">
                      No orders found. Upload a CSV file to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order, index) => (
                    <TableRow key={order.order_id || index}>
                      <TableCell className="font-medium whitespace-nowrap">{order.order_id}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.media_type}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.cancel_flag}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <StatusBadge status={order.operation} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{order.playdate_begin}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.playdate_end}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.hold_key_flag}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.tmc_media_order_id}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.tmc_theatre_id}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.note}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.screening_screen_no}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.screening_time}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.do_not_ship}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.ship_hold_type}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.delivery_method}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.return_method}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.is_no_key}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.booker_name}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.booker_phone}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.booker_email}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.content_id}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{order.content_title}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.package_uuid}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.film_id}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.theatre_id}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.theatre_name}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.chain_name}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.theatre_address1}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.theatre_city}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.theatre_state}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.theatre_postal_code}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.theatre_country}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.qw_identifier}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.qw_theatre_id}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.qw_theatre_name}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.qw_theatre_city}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.qw_theatre_state}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.qw_theatre_country}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.studio_id}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.studio_name}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.qw_company_id}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.qw_company_name}</TableCell>
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