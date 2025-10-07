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
import { mockOrders } from "@/services/mockData";

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
      const isDevelopmentMode = import.meta.env.VITE_DEV_MODE === 'true';
      let ordersData: any[] = [];
      let cplData: any[] = [];

      if (isDevelopmentMode) {
        // Use mock data in development mode
        ordersData = mockOrders;
        // Mock CPL data if needed
      } else {
        // Fetch all orders with pagination
        let allOrders: any[] = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data: ordersBatch, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .range(from, from + batchSize - 1);

          if (ordersError) throw ordersError;
          
          if (ordersBatch && ordersBatch.length > 0) {
            allOrders = [...allOrders, ...ordersBatch];
            from += batchSize;
            hasMore = ordersBatch.length === batchSize;
          } else {
            hasMore = false;
          }
        }

        ordersData = allOrders;

        // Fetch CPL data
        const { data: cplDataResult, error: cplError } = await supabase
          .from('cpl_management')
          .select('*');

        if (cplError) throw cplError;
        cplData = cplDataResult || [];
      }

      // Group orders by content_id only
      const groupedData = ordersData.reduce((acc: any, order: any) => {
        const key = order.content_id;
        
        if (!acc[key]) {
          // Find matching CPL data for this content
          const matchingCpl = cplData.find(cpl => cpl.content_id === order.content_id);
          
          acc[key] = {
            content_id: order.content_id,
            content_title: order.content_title,
            package_uuid: order.package_uuid || '', // Keep for reference but don't use in grouping
            film_id: order.film_id,
            cpl_list: matchingCpl?.cpl_list ? (
              typeof matchingCpl.cpl_list === 'string' 
                ? matchingCpl.cpl_list.split(',').map((s: string) => s.trim()) 
                : matchingCpl.cpl_list
            ) : [],
            cpl_count: 0,
            booking_count: 0,
            pending_bookings: 0,
            shipped: 0,
            downloading: 0,
            completed: 0,
            cancelled: 0,
            updated_on: order.updated_at,
            completion_rate: 0,
            orders: []
          };

          // Calculate CPL count
          if (acc[key].cpl_list.length > 0) {
            acc[key].cpl_count = acc[key].cpl_list.length;
          }
        }

        acc[key].orders.push(order);
        acc[key].booking_count++;

        // Update status counts
        if (!order.booking_ref || !order.booking_ref.trim()) {
          acc[key].pending_bookings++;
        }

        // Keep the most recent update time
        if (new Date(order.updated_at) > new Date(acc[key].updated_on)) {
          acc[key].updated_on = order.updated_at;
        }

        return acc;
      }, {});

      const bookingArray: BookingData[] = Object.values(groupedData);

      // Fetch delivery statuses from Qube Wire API for all content
      try {
        const token = localStorage.getItem('qube_wire_token');
        if (token) {
          qubeWireApi.setToken(token);
          
          // Fetch statuses for each unique content
          const statusPromises = bookingArray.map(async (booking) => {
            try {
              const statuses = await qubeWireApi.getDeliveryStatuses(booking.content_id);
              return { content_id: booking.content_id, statuses };
            } catch (error) {
              console.warn(`Failed to fetch statuses for content ${booking.content_id}:`, error);
              return { content_id: booking.content_id, statuses: [] };
            }
          });

          const allStatuses = await Promise.all(statusPromises);
          
          // Update booking data with Qube Wire statuses
          bookingArray.forEach(booking => {
            const statusData = allStatuses.find(s => s.content_id === booking.content_id);
            if (statusData && statusData.statuses.length > 0) {
              booking.qube_wire_status = statusData.statuses;
              
              // Update counts based on API status
              statusData.statuses.forEach(status => {
                switch (status.status) {
                  case 'downloading':
                    booking.downloading++;
                    break;
                  case 'completed':
                    booking.completed++;
                    break;
                  case 'cancelled':
                  case 'failed':
                    booking.cancelled++;
                    break;
                }
              });
              
              // Calculate completion rate
              if (booking.booking_count > 0) {
                booking.completion_rate = Math.round((booking.completed / booking.booking_count) * 100);
              }
            }
          });
        }
      } catch (apiError) {
        console.warn('Failed to fetch delivery statuses from Qube Wire API:', apiError);
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
    // Filter only pending orders (those without booking_ref)
    const pendingOrders = contentData.orders.filter(order => !order.booking_ref);
    
    if (pendingOrders.length === 0) {
      toast({
        title: "No Pending Bookings",
        description: "All bookings for this content have already been created",
        variant: "default"
      });
      return;
    }

    setIsCreatingBookings(true);

    try {
      // Group pending orders by distributor (studio_id + qw_company_id)
      const ordersByDistributor = pendingOrders.reduce((acc: any, order: any) => {
        if (!order.studio_id || !order.qw_company_id) {
          console.warn('Order missing distributor information:', order.id);
          return acc;
        }
        
        const distributorKey = `${order.studio_id}_${order.qw_company_id}`;
        
        if (!acc[distributorKey]) {
          acc[distributorKey] = {
            studio_id: order.studio_id,
            qw_company_id: order.qw_company_id,
            studio_name: order.studio_name,
            qw_company_name: order.qw_company_name,
            orders: []
          };
        }
        
        acc[distributorKey].orders.push(order);
        return acc;
      }, {});

      const distributorGroups = Object.values(ordersByDistributor) as any[];
      
      if (distributorGroups.length === 0) {
        toast({
          title: "Error",
          description: "No orders with valid distributor information found",
          variant: "destructive"
        });
        return;
      }

      // Fetch PATs for all distributors using OR conditions for each studio_id + qw_company_id pair
      let distributorsQuery = supabase
        .from('distributors')
        .select('studio_id, qw_company_id, qw_pat_encrypted');

      // Build OR conditions for each distributor pair
      if (distributorGroups.length > 0) {
        const orConditions = distributorGroups.map(g => 
          `and(studio_id.eq.${g.studio_id},qw_company_id.eq.${g.qw_company_id})`
        ).join(',');
        distributorsQuery = distributorsQuery.or(orConditions);
      }

      const { data: distributors, error: distributorsError } = await distributorsQuery;

      if (distributorsError) {
        console.error('Error fetching distributors:', distributorsError);
        toast({
          title: "Error",
          description: "Failed to fetch distributor information",
          variant: "destructive"
        });
        return;
      }

      let totalCreatedBookings = 0;
      let totalProcessedOrders = 0;
      const failedDistributors: string[] = [];

      // Process each distributor group separately
      for (const distributorGroup of distributorGroups) {
        const distributor = distributors?.find(d => 
          d.studio_id === distributorGroup.studio_id && 
          d.qw_company_id === distributorGroup.qw_company_id
        );

        if (!distributor || !distributor.qw_pat_encrypted) {
          console.warn(`No PAT found for distributor: ${distributorGroup.studio_name} (${distributorGroup.studio_id})`);
          failedDistributors.push(`${distributorGroup.studio_name}`);
          continue;
        }

        try {
          // Decrypt the PAT (it's base64 encoded)
          const decryptedPAT = atob(distributor.qw_pat_encrypted);
          qubeWireApi.setToken(decryptedPAT);

          // Build dcpDeliveries array for this distributor's orders
          const dcpDeliveries = distributorGroup.orders.map((order: any) => ({
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
          
          // Update orders with their corresponding dcpDeliveryId
          if (response.dcpDeliveries && response.dcpDeliveries.length > 0) {
            for (let i = 0; i < distributorGroup.orders.length; i++) {
              const order = distributorGroup.orders[i];
              const delivery = response.dcpDeliveries[i];
              
              if (delivery && delivery.dcpDeliveryId) {
                await supabase
                  .from('orders')
                  .update({ 
                    booking_ref: delivery.dcpDeliveryId,
                    booking_created_at: new Date().toISOString()
                  })
                  .eq('id', order.id);
                
                totalProcessedOrders++;
              }
            }
            
            totalCreatedBookings += response.dcpDeliveries.length;
          }

        } catch (error: any) {
          console.error(`Error creating bookings for distributor ${distributorGroup.studio_name}:`, error);
          failedDistributors.push(`${distributorGroup.studio_name}: ${error.message}`);
        }
      }

      // Show appropriate success/error messages
      if (totalCreatedBookings > 0) {
        toast({
          title: "Bookings Created",
          description: `Successfully created ${totalCreatedBookings} booking(s) for ${contentData.content_title}`,
        });
        
        // Refresh the booking data
        fetchBookingData();
      }

      if (failedDistributors.length > 0) {
        toast({
          title: failedDistributors.length === distributorGroups.length ? "Booking Creation Failed" : "Partial Success",
          description: `Failed for distributors: ${failedDistributors.join(', ')}`,
          variant: "destructive"
        });
      }

      if (totalCreatedBookings === 0 && failedDistributors.length === 0) {
        toast({
          title: "Booking Creation Failed",
          description: "No deliveries returned from API",
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

  const handleViewDetails = async (item: BookingData) => {
    try {
      // Make API call to v1/dcps
      const token = localStorage.getItem('qube_wire_token');
      if (token) {
        qubeWireApi.setToken(token);
        const deliveryStatuses = await qubeWireApi.getDeliveryStatuses(item.content_id);
        console.log('Delivery statuses from v1/dcps:', deliveryStatuses);
      }
    } catch (error) {
      console.error('Error fetching delivery statuses:', error);
      toast({
        title: "API Warning",
        description: "Unable to fetch delivery data from Qube Wire API",
        variant: "destructive"
      });
    }
    
    navigate(`/delivery-details/${item.content_id}`);
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
                            disabled={isCreatingBookings || item.cpl_count === 0 || item.pending_bookings === 0}
                          >
                            <Send className={`h-3 w-3 mr-1 ${isCreatingBookings ? 'animate-pulse' : ''}`} />
                            {isCreatingBookings ? 'Creating...' : 'Create Booking'}
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