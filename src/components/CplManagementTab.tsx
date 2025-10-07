import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Edit, Save, History, Search, RefreshCw, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const CplManagementTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingCpl, setEditingCpl] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cplData, setCplData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchUniqueContent = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch orders in pages to include more than 1000 rows
      const PAGE_SIZE = 1000;
      let from = 0;
      let allOrders: any[] = [];
      while (true) {
        const { data, error } = await supabase
          .from('orders')
          .select('content_id, content_title, package_uuid, film_id, order_id')
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        allOrders = allOrders.concat(data || []);
        if (!data || data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      // Get existing CPL data (all users)
      const { data: cplData, error: cplError } = await supabase
        .from('cpl_management')
        .select('*');

      if (cplError) throw cplError;

      // Get unique combinations and merge with CPL data
      const uniqueContentMap = new Map();
      
      (allOrders || []).forEach((order: any) => {
        const contentId = order.content_id?.toString().trim() || '';
        const packageUuid = order.package_uuid?.toString().trim() || '';
        
        // Skip if either content_id or package_uuid is missing
        if (!contentId || !packageUuid) {
          return;
        }
        
        const key = `${contentId}|||${packageUuid}`;
        
        // Only add if not already in map
        if (!uniqueContentMap.has(key)) {
          // Find existing CPL data for this combination
          const existingCpl = cplData?.find(cpl =>
            cpl.content_id?.toString().trim() === contentId && 
            cpl.package_uuid?.toString().trim() === packageUuid
          );
          
          uniqueContentMap.set(key, {
            content_id: contentId,
            content_title: order.content_title?.toString().trim() || null,
            package_uuid: packageUuid,
            film_id: order.film_id?.toString().trim() || null,
            cpl_list: existingCpl?.cpl_list || '',
            booking_count: 0,
            updated_by: existingCpl?.updated_at ? 'User' : '',
            updated_on: existingCpl?.updated_at || ''
          });
        }
      });
      
      const uniqueContent = Array.from(uniqueContentMap.values());

      setCplData(uniqueContent);
    } catch (error: any) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error loading content",
        description: error.message || "Failed to load content from orders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUniqueContent();
    }
  }, [user]);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setEditingCpl(item.cpl_list);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !editingItem) return;
    
    try {
      const { error } = await supabase
        .from('cpl_management')
        .upsert({
          user_id: user.id,
          content_id: editingItem.content_id,
          content_title: editingItem.content_title,
          package_uuid: editingItem.package_uuid,
          film_id: editingItem.film_id,
          cpl_list: editingCpl
        }, {
          onConflict: 'user_id,content_id,package_uuid'
        });

      if (error) throw error;

      // Update the CPL data in the local state
      setCplData(prevData => 
        prevData.map(item => 
          item.content_id === editingItem?.content_id && item.package_uuid === editingItem?.package_uuid
            ? { ...item, cpl_list: editingCpl, updated_by: 'User', updated_on: new Date().toISOString() }
            : item
        )
      );
      
      toast({
        title: "CPL updated successfully",
        description: `Updated CPL list for content ${editingItem?.content_id}`,
      });
      setDialogOpen(false);
      setEditingItem(null);
      setEditingCpl("");
    } catch (error: any) {
      console.error('Error saving CPL data:', error);
      toast({
        title: "Error saving CPL data",
        description: error.message || "Failed to save CPL data",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setEditingCpl("");
  };

  const handleViewDetails = (item: any) => {
    navigate(`/delivery-details/${item.content_id}/${item.package_uuid}`);
  };

  const filteredData = cplData.filter(item => 
    (item.content_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.content_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.film_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Search and Refresh */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Film, Package & CPL Management
            </CardTitle>
            <div className="flex items-center gap-3">
              <Button 
                onClick={fetchUniqueContent} 
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
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* CPL Management Table */}
      <Card>
        <CardHeader>
          <CardTitle>Content & CPL Mapping</CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing unique content from your orders. Use this to manage CPL assignments.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content ID</TableHead>
                  <TableHead>Content Title</TableHead>
                  <TableHead>Film ID</TableHead>
                  <TableHead>Package UUID</TableHead>
                  <TableHead>CPL List</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading content...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <TableRow key={`${item.content_id}-${item.package_uuid}` || index}>
                      <TableCell className="font-medium">{item.content_id || '-'}</TableCell>
                      <TableCell className="font-medium">{item.content_title || '-'}</TableCell>
                      <TableCell>{item.film_id || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">{item.package_uuid || '-'}</TableCell>
                      <TableCell className={`max-w-md ${!item.cpl_list ? 'bg-destructive/10 border-destructive/20' : ''}`}>
                        <div className="space-y-1">
                          {item.cpl_list ? (
                            item.cpl_list.split(',').map((cpl: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="mr-1 mb-1">
                                {cpl.trim()}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-destructive font-medium">No CPLs defined</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(item)}
                            className="h-8"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleViewDetails(item)}
                            className="h-8"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8">
                            <History className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {cplData.length === 0 ? (
                        <div className="space-y-2">
                          <p className="text-muted-foreground">No content found in your orders</p>
                          <p className="text-xs text-muted-foreground">Upload some orders first to manage CPLs</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-muted-foreground">No content found matching your search</p>
                          <p className="text-xs text-muted-foreground">Total unique content: {cplData.length}</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit CPL Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit CPL List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Content Details</Label>
              <div className="bg-muted p-3 rounded-md">
                <p><span className="font-medium">Content ID:</span> {editingItem?.content_id}</p>
                <p><span className="font-medium">Title:</span> {editingItem?.content_title}</p>
                <p><span className="font-medium">Film ID:</span> {editingItem?.film_id}</p>
                <p><span className="font-medium">Package UUID:</span> {editingItem?.package_uuid}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpl-list" className="text-sm font-medium">
                CPL List (comma-separated)
              </Label>
              <Textarea
                id="cpl-list"
                value={editingCpl}
                onChange={(e) => setEditingCpl(e.target.value)}
                placeholder="Enter CPL IDs separated by commas..."
                className="min-h-32"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CplManagementTab;