import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Search, RefreshCw, Eye, TrendingUp, Package, AlertCircle, Send } from "lucide-react";
import StatusBadge from "./StatusBadge";
import ApiSettingsDialog from "./ApiSettingsDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { qubeWireApi, type DeliveryStatus } from "@/services/qubeWireApi";

interface BookingData {
  content_id: string;
  content_title: string;
  package_uuid: string;
  film_id: string;
  cpl_list: string[];
  cpl_count: number;
  booking_count: number;
  pending_bookings: number;
  shipped: number;
  downloading: number;
  completed: number;
  cancelled: number;
  updated_on: string;
  completion_rate: number;
  orders: any[];
  qube_wire_status?: DeliveryStatus[];
}

const BookingManagerTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingBookings, setIsCreatingBookings] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBookingData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch all orders for the user
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id);

      if (ordersError) throw ordersError;

      // Fetch CPL data for the user
      const { data: cplData, error: cplError } = await supabase
        .from('cpl_management')
        .select('*')
        .eq('user_id', user.id);

      if (cplError) throw cplError;

      const orders = ordersData;

      // Create a map of CPL data by content_id and package_uuid
      const cplMap = new Map<string, string[]>();
      cplData?.forEach(cpl => {
        const key = `${cpl.content_id}-${cpl.package_uuid}`;
        if (!cplMap.has(key)) {
          cplMap.set(key, []);
        }
        const list = (cpl.cpl_list || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
        const current = cplMap.get(key)!;
        list.forEach((item: string) => {
          if (!current.includes(item)) current.push(item);
        });
      });

      // Group orders by content_id and package_uuid to create booking data
      const contentMap = new Map<string, BookingData>();
      
      orders?.forEach(order => {
        if (!order.content_id || !order.content_title) return;
        
        const key = `${order.content_id}-${order.package_uuid}`;
        
        if (!contentMap.has(key)) {
          const cplList = cplMap.get(key) || [];
          contentMap.set(key, {
            content_id: order.content_id,
            content_title: order.content_title,
            package_uuid: order.package_uuid,
            film_id: order.film_id,
            cpl_list: cplList,
            cpl_count: cplList.length,
            booking_count: 0,
            pending_bookings: 0,
            shipped: 0,
            downloading: 0,
            completed: 0,
            cancelled: 0,
            updated_on: order.updated_at,
            completion_rate: 0,
            orders: []
          });
        }
        
        const content = contentMap.get(key)!;
        content.orders.push(order);
        content.booking_count++;
        
        // Count bookings based on actual booking_ref status
        if (order.booking_ref) {
          // If booking reference exists, consider it as processed
          if (order.operation?.toLowerCase() === 'cancel') {
            content.cancelled++;
          } else {
            content.shipped++; // Has booking reference, so it's been processed
          }
        } else {
          // No booking reference means it's still pending
          content.pending_bookings++;
        }
        
        // Update latest timestamp
        if (new Date(order.updated_at) > new Date(content.updated_on)) {
          content.updated_on = order.updated_at;
        }
      });

      // Fetch real-time status from Qube Wire API for each content
      const bookingArray = Array.from(contentMap.values());
      
      // Try to fetch delivery statuses from Qube Wire API
      try {
        const token = localStorage.getItem('qube_wire_token');
        if (token) {
          qubeWireApi.setToken(token);
          
          for (const content of bookingArray) {
            try {
              const deliveryStatuses = await qubeWireApi.getDeliveryStatuses(
                content.content_id, 
                content.package_uuid
              );
              
              if (deliveryStatuses && deliveryStatuses.length > 0) {
                content.qube_wire_status = deliveryStatuses;
                
                // Update counts based on real API data
                content.completed = deliveryStatuses.filter(s => s.status === 'completed').length;
                content.shipped = deliveryStatuses.filter(s => s.status === 'shipped').length;
                content.downloading = deliveryStatuses.filter(s => s.status === 'downloading').length;
                content.pending_bookings = deliveryStatuses.filter(s => s.status === 'pending').length;
                content.cancelled = deliveryStatuses.filter(s => s.status === 'cancelled' || s.status === 'failed').length;
                
                content.completion_rate = content.booking_count > 0 
                  ? Math.round((content.completed / content.booking_count) * 100) 
                  : 0;
              }
            } catch (apiError) {
              console.warn(`Failed to fetch delivery status for ${content.content_id}:`, apiError);
              // Fall back to actual order data
              const completedOrders = content.orders.filter(order => 
                order.booking_ref && order.operation?.toLowerCase() !== 'cancel'
              );
              content.completed = completedOrders.length;
              content.downloading = Math.max(0, content.shipped - content.completed);
              content.completion_rate = content.booking_count > 0 
                ? Math.round((content.completed / content.booking_count) * 100) 
                : 0;
            }
          }
        } else {
          // No API token - calculate based on actual booking references and order data
          bookingArray.forEach(content => {
            // Use actual data: completed are those with booking_ref and not cancelled
            const completedOrders = content.orders.filter(order => 
              order.booking_ref && order.operation?.toLowerCase() !== 'cancel'
            );
            content.completed = completedOrders.length;
            
            // Calculate downloading as shipped but not yet completed
            content.downloading = Math.max(0, content.shipped - content.completed);
            
            content.completion_rate = content.booking_count > 0 
              ? Math.round((content.completed / content.booking_count) * 100) 
              : 0;
          });
        }
      } catch (apiError) {
        console.warn('Failed to fetch delivery statuses from Qube Wire API:', apiError);
        // Use actual order data as fallback instead of mock calculations
        bookingArray.forEach(content => {
          // Use actual data: completed are those with booking_ref and not cancelled
          const completedOrders = content.orders.filter(order => 
            order.booking_ref && order.operation?.toLowerCase() !== 'cancel'
          );
          content.completed = completedOrders.length;
          
          // Calculate downloading as shipped but not yet completed
          content.downloading = Math.max(0, content.shipped - content.completed);
          
          content.completion_rate = content.booking_count > 0 
            ? Math.round((content.completed / content.booking_count) * 100) 
            : 0;
        });
      }

      setBookingData(bookingArray);
    } catch (error: any) {
      console.error('Error fetching booking data:', error);
      toast({
        title: "Error loading booking data",
        description: error.message || "Failed to load booking information",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const createBookingsForContent = async (contentData: BookingData) => {
    const token = localStorage.getItem('qube_wire_token');
    if (!token) {
      toast({
        title: "API Token Required",
        description: "Please configure your Qube Wire Personal Access Token in API Settings",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingBookings(true);

    try {
      qubeWireApi.setToken(token);

      // Build dcpDeliveries array from orders
      const dcpDeliveries = contentData.orders.map(order => ({
        theatreId: order.qw_theatre_id,
        cplIds: contentData.cpl_list,
        deliverBefore: order.playdate_end,
        deliveryMode: "auto",
        statusEmails: order.booker_email ? [order.booker_email] : [],
        notes: order.note || ""
      }));

      const bookingRequest = {
        clientReferenceId: contentData.content_id,
        dcpDeliveries
      };

      const response = await qubeWireApi.createBooking(bookingRequest);
      
      // Update all orders with booking reference
      if (response.booking_id) {
        for (const order of contentData.orders) {
          await supabase
            .from('orders')
            .update({ 
              booking_ref: response.booking_id,
              booking_created_at: new Date().toISOString()
            })
            .eq('id', order.id);
        }

        toast({
          title: "Bookings Created",
          description: `Successfully created bookings for ${contentData.content_title}`,
        });
        
        // Refresh the booking data
        fetchBookingData();
      } else {
        toast({
          title: "Booking Creation Failed",
          description: "No booking ID returned from API",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error creating bookings:', error);
      toast({
        title: "Error creating bookings",
        description: error.message || "Failed to create bookings",
        variant: "destructive"
      });
    } finally {
      setIsCreatingBookings(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookingData();
    }
  }, [user, fetchBookingData]);

  const handleViewDetails = (item: BookingData) => {
    navigate(`/delivery-details/${item.content_id}/${item.package_uuid}`);
  };

  const filteredData = bookingData.filter(item => 
    (item.content_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.content_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBookings = filteredData.reduce((sum, item) => sum + item.booking_count, 0);
  const totalPending = filteredData.reduce((sum, item) => sum + item.pending_bookings, 0);
  const totalCompleted = filteredData.reduce((sum, item) => sum + item.completed, 0);

  return (
    <div className="space-y-6">
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-status-warning" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{totalPending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-status-success" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{totalCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {totalBookings > 0 ? Math.round((totalCompleted / totalBookings) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Manager Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Booking Status Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              <ApiSettingsDialog />
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={fetchBookingData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content Title</TableHead>
                  <TableHead>CPL Status</TableHead>
                  <TableHead>Total Bookings</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Delivery Progress</TableHead>
                  <TableHead>Status Breakdown</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading booking data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <TableRow key={`${item.content_id}-${item.package_uuid}` || index}>
                      <TableCell className="font-medium">{item.content_title}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {item.cpl_count > 0 ? (
                                <Badge variant="outline" className="bg-status-success-bg text-status-success cursor-help">
                                  {item.cpl_count} CPL{item.cpl_count !== 1 ? 's' : ''}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-status-error-bg text-status-error">
                                  No CPL
                                </Badge>
                              )}
                            </TooltipTrigger>
                            {item.cpl_count > 0 && (
                              <TooltipContent>
                                <div className="max-w-xs">
                                  <p className="font-medium mb-1">Mapped CPLs:</p>
                                  <p className="text-xs whitespace-pre-wrap break-words">
                                    {Array.isArray(item.cpl_list) ? item.cpl_list.join(', ') : String(item.cpl_list || '')}
                                  </p>
                                </div>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          {item.booking_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={item.pending_bookings > 0 ? 
                            "bg-status-warning-bg text-status-warning" : 
                            "bg-status-success-bg text-status-success"
                          }
                        >
                          {item.pending_bookings}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-48">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{item.completion_rate}%</span>
                          </div>
                          <Progress value={item.completion_rate} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="bg-status-success-bg text-status-success text-xs">
                            {item.shipped} Shipped
                          </Badge>
                          <Badge variant="outline" className="bg-status-pending-bg text-status-pending text-xs">
                            {item.downloading} Downloading
                          </Badge>
                          <Badge variant="outline" className="bg-status-success-bg text-status-success text-xs">
                            {item.completed} Done
                          </Badge>
                          {item.cancelled > 0 && (
                            <Badge variant="outline" className="bg-status-error-bg text-status-error text-xs">
                              {item.cancelled} Cancelled
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.updated_on ? new Date(item.updated_on).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8"
                            onClick={() => handleViewDetails(item)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="h-8"
                            onClick={() => createBookingsForContent(item)}
                            disabled={isCreatingBookings || item.cpl_count === 0}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Create Booking
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="space-y-2">
                        <p className="text-muted-foreground">No booking data found</p>
                        <p className="text-xs text-muted-foreground">
                          {searchTerm ? 'Try adjusting your search criteria' : 'Upload some orders to see booking information'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingManagerTab;