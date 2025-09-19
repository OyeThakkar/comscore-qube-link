import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, RefreshCw, Package, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StatusBadge from "@/components/StatusBadge";

const DeliveryDetails = () => {
  const { contentId, packageUuid } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [contentInfo, setContentInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bulkBookingRef, setBulkBookingRef] = useState("");
  const [bookingRefs, setBookingRefs] = useState<{[key: string]: string}>({});
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDeliveries = async () => {
    if (!user || !contentId || !packageUuid) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .eq('package_uuid', packageUuid);

      if (error) throw error;

      setDeliveries(data || []);
      
      // Initialize booking refs from existing data
      const refs: {[key: string]: string} = {};
      data?.forEach(delivery => {
        if (delivery.booking_ref) {
          refs[delivery.id] = delivery.booking_ref;
        }
      });
      setBookingRefs(refs);
      
      // Set content info from first record
      if (data && data.length > 0) {
        setContentInfo({
          content_id: data[0].content_id,
          content_title: data[0].content_title,
          film_id: data[0].film_id,
          package_uuid: data[0].package_uuid
        });
      }
    } catch (error: any) {
      console.error('Error fetching deliveries:', error);
      toast({
        title: "Error loading deliveries",
        description: error.message || "Failed to load delivery data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && contentId && packageUuid) {
      fetchDeliveries();
    }
  }, [user, contentId, packageUuid]);

  const getDeliveryStatus = (order: any): "pending" | "shipped" | "downloading" | "delivered" | "downloaded" | "cancelled" => {
    // Mock status logic - in real app this would be based on actual delivery tracking
    const statuses: ("pending" | "shipped" | "downloading" | "delivered" | "downloaded" | "cancelled")[] = 
      ['pending', 'shipped', 'downloading', 'delivered', 'downloaded', 'cancelled'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getDeliveryType = (deliveryMethod: string) => {
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

  const handleBulkBookingRefApply = async () => {
    if (!bulkBookingRef.trim()) {
      toast({
        title: "Error",
        description: "Please enter a booking reference",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const updates = filteredDeliveries.map(delivery => ({
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
      filteredDeliveries.forEach(delivery => {
        newBookingRefs[delivery.id] = bulkBookingRef;
      });
      setBookingRefs(prev => ({ ...prev, ...newBookingRefs }));

      toast({
        title: "Success",
        description: `Applied booking reference to ${filteredDeliveries.length} deliveries`
      });

      setBulkBookingRef("");
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

  const getDeliveryDetails = (delivery: any, deliveryType: string) => {
    if (deliveryType === 'WireTAP') {
      return (
        <div className="space-y-1 text-sm">
          <div><span className="font-medium">Serial:</span> {delivery.wiretap_serial_number || 'N/A'}</div>
          <div><span className="font-medium">Tracking:</span> {delivery.tracking_id || 'N/A'}</div>
        </div>
      );
    } else if (deliveryType === 'Electronic - Partner') {
      return (
        <div className="text-sm">
          <span className="font-medium">Partner:</span> {delivery.partner_name || 'N/A'}
        </div>
      );
    }
    return <span className="text-muted-foreground">-</span>;
  };

  const filteredDeliveries = deliveries.filter(delivery => 
    (delivery.theatre_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (delivery.qw_theatre_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (delivery.tmc_theatre_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to CPL Management
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
                  placeholder="Enter booking reference to apply to all visible deliveries..."
                  value={bulkBookingRef}
                  onChange={(e) => setBulkBookingRef(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleBulkBookingRefApply}
                  disabled={isSaving || !bulkBookingRef.trim() || filteredDeliveries.length === 0}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Apply to {filteredDeliveries.length} deliveries
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Deliveries Table */}
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Theatre Name & Location</TableHead>
                      <TableHead>QW Theatre ID</TableHead>
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
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-medium">{delivery.theatre_name || '-'}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatLocation(delivery)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {delivery.qw_theatre_id || delivery.tmc_theatre_id || '-'}
                          </TableCell>
                          <TableCell>
                            {delivery.playdate_begin ? 
                              new Date(delivery.playdate_begin).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getDeliveryType(delivery.delivery_method)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View History
                            </Button>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={getDeliveryStatus(delivery)} />
                          </TableCell>
                          <TableCell>
                            {getDeliveryDetails(delivery, getDeliveryType(delivery.delivery_method))}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input 
                                placeholder="Enter booking ref..."
                                value={bookingRefs[delivery.id] || ''}
                                onChange={(e) => handleIndividualBookingRefChange(delivery.id, e.target.value)}
                                className="w-32 h-8 text-sm"
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