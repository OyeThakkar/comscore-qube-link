import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Search, RefreshCw, Package, Save, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StatusBadge from "@/components/StatusBadge";
import ApiSettingsDialog from "@/components/ApiSettingsDialog";
import { qubeWireApi, type DeliveryStatus } from "@/services/qubeWireApi";
import { mockOrders, mockDeliveryStatuses } from "@/services/mockData";

const isDevelopmentMode = import.meta.env.VITE_DEV_MODE === 'true';

const DeliveryDetails = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [contentInfo, setContentInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bulkBookingRef, setBulkBookingRef] = useState("");
  const [bookingRefs, setBookingRefs] = useState<{[key: string]: string}>({});
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [qubeWireStatuses, setQubeWireStatuses] = useState<DeliveryStatus[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDeliveries = useCallback(async () => {
    if (!contentId) return;
    
    setIsLoading(true);
    try {
      let deliveriesData;

      if (isDevelopmentMode) {
        // Use mock data in development mode
        deliveriesData = mockOrders.filter(order => order.content_id === contentId);
      } else {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('content_id', contentId);

        if (error) throw error;
        deliveriesData = data || [];
      }

      setDeliveries(deliveriesData);
      
      // Initialize booking refs from existing data
      const refs: {[key: string]: string} = {};
      deliveriesData?.forEach(delivery => {
        if (delivery.booking_ref) {
          refs[delivery.id] = delivery.booking_ref;
        }
      });
      setBookingRefs(refs);
      
      // Set content info from first record
      if (deliveriesData && deliveriesData.length > 0) {
        setContentInfo({
          content_id: deliveriesData[0].content_id,
          content_title: deliveriesData[0].content_title,
          film_id: deliveriesData[0].film_id,
          package_uuid: deliveriesData[0].package_uuid
        });
      }

      // Fetch real-time status from Qube Wire API
      try {
        const token = localStorage.getItem('qube_wire_token');
        if (token && contentId) {
          qubeWireApi.setToken(token);
          const statuses = await qubeWireApi.getDeliveryStatuses(contentId);
          setQubeWireStatuses(statuses || []);
        }
      } catch (apiError) {
        console.warn('Failed to fetch delivery statuses from Qube Wire API:', apiError);
        toast({
          title: "API Warning",
          description: "Unable to fetch real-time delivery status from Qube Wire",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Error fetching deliveries:', error);
      toast({
        title: "Error loading deliveries",
        description: error.message || "Failed to load delivery information",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [contentId, toast]);

  useEffect(() => {
    if (contentId) {
      fetchDeliveries();
    }
  }, [contentId, fetchDeliveries]);

  const getDeliveryStatus = (order: any): "pending" | "shipped" | "downloading" | "delivered" | "downloaded" | "cancelled" => {
    // Check if we have real-time status from Qube Wire API
    const qubeWireStatus = qubeWireStatuses.find(status => 
      status.dcpDeliveryId === order.booking_ref || 
      status.theatreId === order.qw_theatre_id ||
      status.theatreId === order.tmc_theatre_id ||
      status.theatreName === order.theatre_name
    );
    
    if (qubeWireStatus) {
      switch (qubeWireStatus.status) {
        case 'completed':
          return 'delivered';
        case 'downloading':
          return 'downloading';
        case 'shipped':
          return 'shipped';
        case 'pending':
          return 'pending';
        case 'cancelled':
        case 'failed':
          return 'cancelled';
        default:
          return 'pending';
      }
    }

    // If no booking reference is present, status is pending
    if (!order.booking_ref || !order.booking_ref.trim()) {
      return 'pending';
    }

    // If booking reference exists but no API status, assume shipped
    return 'shipped';
  };

  const getQubeWireProgress = (order: any): number => {
    const qubeWireStatus = qubeWireStatuses.find(status => 
      status.dcpDeliveryId === order.booking_ref || 
      status.theatreId === order.qw_theatre_id ||
      status.theatreId === order.tmc_theatre_id ||
      status.theatreName === order.theatre_name
    );
    
    return qubeWireStatus?.progress || 0;
  };

  const getDeliveryType = (order: any) => {
    // First check if we have delivery type from Qube Wire API
    const qubeWireStatus = qubeWireStatuses.find(status => 
      status.dcpDeliveryId === order.booking_ref || 
      status.theatreId === order.qw_theatre_id ||
      status.theatreId === order.tmc_theatre_id ||
      status.theatreName === order.theatre_name
    );
    
    if (qubeWireStatus?.deliveryType) {
      return qubeWireStatus.deliveryType;
    }
    
    // Fallback to delivery method from order
    const deliveryMethod = order.delivery_method;
    if (!deliveryMethod) return 'Electronic - Partner';
    if (deliveryMethod.toLowerCase().includes('wiretap')) return 'WireTAP';
    if (deliveryMethod.toLowerCase().includes('drive')) return 'Hard Drive';
    return 'Electronic - Partner';
  };

  const formatLocation = (order: any) => {
    const parts = [
      order.theatre_city,
      order.theatre_state,
      order.theatre_country
    ].filter(Boolean);
    return parts.length > 0 ? ` (${parts.join(', ')})` : '';
  };

  const filteredDeliveries = deliveries.filter(delivery => 
    (delivery.theatre_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (delivery.qw_theatre_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (delivery.tmc_theatre_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredDeliveries.map(delivery => delivery.id));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (deliveryId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(deliveryId);
    } else {
      newSelected.delete(deliveryId);
    }
    setSelectedRows(newSelected);
  };

  const selectedDeliveries = filteredDeliveries.filter(delivery => selectedRows.has(delivery.id));

  const handleBulkBookingRefApply = async () => {
    if (!bulkBookingRef.trim()) {
      toast({
        title: "Error",
        description: "Please enter a booking reference",
        variant: "destructive"
      });
      return;
    }

    if (selectedDeliveries.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one delivery",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const updates = selectedDeliveries.map(delivery => ({
        ...delivery,
        booking_ref: bulkBookingRef,
        booking_created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('orders')
        .upsert(updates);

      if (error) throw error;

      // Update local state
      const newBookingRefs: {[key: string]: string} = {};
      selectedDeliveries.forEach(delivery => {
        newBookingRefs[delivery.id] = bulkBookingRef;
      });
      setBookingRefs(prev => ({ ...prev, ...newBookingRefs }));

      toast({
        title: "Success",
        description: `Applied booking reference to ${selectedDeliveries.length} deliveries`
      });

      setBulkBookingRef("");
      setSelectedRows(new Set());
      fetchDeliveries();
    } catch (error: any) {
      console.error('Error updating booking references:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update booking references",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleIndividualBookingRefChange = (deliveryId: string, value: string) => {
    setBookingRefs(prev => ({ ...prev, [deliveryId]: value }));
  };

  const saveIndividualBookingRef = async (deliveryId: string) => {
    const bookingRef = bookingRefs[deliveryId];
    if (!bookingRef?.trim()) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          booking_ref: bookingRef,
          booking_created_at: new Date().toISOString()
        })
        .eq('id', deliveryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking reference updated"
      });

      fetchDeliveries();
    } catch (error: any) {
      console.error('Error updating booking reference:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update booking reference",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDeliveryDetails = (order: any, deliveryType: string) => {
    // First check if we have delivery details from Qube Wire API
    const qubeWireStatus = qubeWireStatuses.find(status => 
      status.dcpDeliveryId === order.booking_ref || 
      status.theatreId === order.qw_theatre_id ||
      status.theatreId === order.tmc_theatre_id ||
      status.theatreName === order.theatre_name
    );
    
    if (qubeWireStatus?.deliveryDetails) {
      if (qubeWireStatus.deliveryDetails.serialNumber) {
        return (
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">Serial:</span> {qubeWireStatus.deliveryDetails.serialNumber}</div>
            {qubeWireStatus.deliveryDetails.trackingId && (
              <div><span className="font-medium">Tracking:</span> {qubeWireStatus.deliveryDetails.trackingId}</div>
            )}
          </div>
        );
      } else if (qubeWireStatus.deliveryDetails.partner) {
        return (
          <div className="text-sm">
            <span className="font-medium">Partner:</span> {qubeWireStatus.deliveryDetails.partner}
          </div>
        );
      }
    }
    
    // Fallback to order data
    if (deliveryType === 'WireTAP') {
      return (
        <div className="space-y-1 text-sm">
          <div><span className="font-medium">Serial:</span> {order.wiretap_serial_number || 'N/A'}</div>
          <div><span className="font-medium">Tracking:</span> {order.tracking_id || 'N/A'}</div>
        </div>
      );
    } else if (deliveryType === 'Electronic - Partner') {
      return (
        <div className="text-sm">
          <span className="font-medium">Partner:</span> {order.partner_name || 'N/A'}
        </div>
      );
    }
    return <span className="text-muted-foreground">-</span>;
  };


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/?tab=booking-manager")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Booking Manager
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Delivery Details</h1>
                <p className="text-sm text-muted-foreground">
                  {contentInfo ? `${contentInfo.content_title} (${contentInfo.content_id})` : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Content Information */}
          {contentInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Content Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Content ID:</span>
                    <p className="text-muted-foreground">{contentInfo.content_id}</p>
                  </div>
                  <div>
                    <span className="font-medium">Content Title:</span>
                    <p className="text-muted-foreground">{contentInfo.content_title}</p>
                  </div>
                  <div>
                    <span className="font-medium">Film ID:</span>
                    <p className="text-muted-foreground">{contentInfo.film_id || '-'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Package UUID:</span>
                    <p className="text-muted-foreground font-mono text-xs">{contentInfo.package_uuid}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search and Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Delivery List ({filteredDeliveries.length} deliveries)</CardTitle>
                <div className="flex items-center gap-3">
                  <ApiSettingsDialog />
                  <Button 
                    onClick={fetchDeliveries} 
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search theatres..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-80"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Bulk Booking Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Bulk Booking Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Enter booking reference to apply to selected deliveries..."
                  value={bulkBookingRef}
                  onChange={(e) => setBulkBookingRef(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleBulkBookingRefApply}
                  disabled={isSaving || !bulkBookingRef.trim() || selectedDeliveries.length === 0}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Apply to {selectedDeliveries.length} selected
                </Button>
              </div>
              {selectedRows.size > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedRows.size} deliveries selected
                </p>
              )}
            </CardContent>
          </Card>

          {/* Deliveries Table */}
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedRows.size === filteredDeliveries.length && filteredDeliveries.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all deliveries"
                        />
                      </TableHead>
                      <TableHead>Theatre Name</TableHead>
                      <TableHead>Deliver Before</TableHead>
                      <TableHead>Delivery Type</TableHead>
                      <TableHead>Event History</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Delivery Details</TableHead>
                      <TableHead>Booking Ref</TableHead>
                      <TableHead>Booking Created On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Loading deliveries...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredDeliveries.length > 0 ? (
                      filteredDeliveries.map((delivery, index) => (
                        <TableRow key={delivery.id || index}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRows.has(delivery.id)}
                              onCheckedChange={(checked) => handleSelectRow(delivery.id, checked as boolean)}
                              aria-label={`Select delivery for ${delivery.theatre_name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <div 
                                className="font-medium cursor-help" 
                                title={`QW Theatre ID: ${delivery.qw_theatre_id || delivery.tmc_theatre_id || 'N/A'}`}
                              >
                                {delivery.theatre_name || '-'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatLocation(delivery)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {delivery.playdate_begin ? 
                              new Date(delivery.playdate_begin).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getDeliveryType(delivery)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View History
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <StatusBadge status={getDeliveryStatus(delivery)} />
                              {getQubeWireProgress(delivery) > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  Progress: {getQubeWireProgress(delivery)}%
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getDeliveryDetails(delivery, getDeliveryType(delivery))}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input 
                                placeholder="Enter booking ref..."
                                value={bookingRefs[delivery.id] || ''}
                                onChange={(e) => handleIndividualBookingRefChange(delivery.id, e.target.value)}
                                className="w-32 h-8 text-sm"
                                disabled={!!qubeWireStatuses.find(status => 
                                  status.dcpDeliveryId === delivery.booking_ref || 
                                  status.theatreId === delivery.qw_theatre_id ||
                                  status.theatreId === delivery.tmc_theatre_id
                                )}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    saveIndividualBookingRef(delivery.id);
                                  }
                                }}
                              />
                              {bookingRefs[delivery.id] && bookingRefs[delivery.id] !== delivery.booking_ref && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => saveIndividualBookingRef(delivery.id)}
                                  disabled={isSaving}
                                  className="h-8 px-2"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {delivery.booking_created_at ? 
                              new Date(delivery.booking_created_at).toLocaleDateString() : 
                              (delivery.created_at ? new Date(delivery.created_at).toLocaleDateString() : '-')}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="space-y-2">
                            <p className="text-muted-foreground">No deliveries found</p>
                            <p className="text-xs text-muted-foreground">
                              {searchTerm ? 'Try adjusting your search criteria' : 'No delivery data available for this content'}
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
      </main>
    </div>
  );
};

export default DeliveryDetails;