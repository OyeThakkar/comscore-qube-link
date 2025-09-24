import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Key, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Distributor {
  id: string;
  studio_id: string;
  studio_name: string;
  qw_company_id: string;
  qw_company_name: string;
  qw_pat_encrypted: string | null;
  created_at: string;
  updated_at: string;
  user_id?: string;
  isFromOrders?: boolean;
}

type SortField = 'studio_id' | 'studio_name' | 'qw_company_name';
type SortDirection = 'asc' | 'desc';

export const DistributorManagementTab = () => {
  const { user } = useAuth();
  const { hasPermission, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdatePATDialogOpen, setIsUpdatePATDialogOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [sortField, setSortField] = useState<SortField>('studio_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Form states
  const [newDistributor, setNewDistributor] = useState({
    studio_id: "",
    studio_name: "",
    qw_company_id: "",
    qw_company_name: "",
    qw_pat: ""
  });
  const [updatePAT, setUpdatePAT] = useState("");

  const fetchDistributors = async () => {
    if (!user) return;
    
    try {
      // Fetch existing distributors
      const { data: existingDistributors, error: distributorsError } = await supabase
        .from('distributors')
        .select('*')
        .order('studio_name', { ascending: true });

      if (distributorsError) {
        console.error('Error fetching distributors:', distributorsError);
        toast({
          title: "Error",
          description: "Failed to fetch distributors",
          variant: "destructive",
        });
        return;
      }

      // Fetch unique studio/company combinations from orders
      const { data: orderCombinations, error: ordersError } = await supabase
        .from('orders')
        .select('studio_id, studio_name, qw_company_id, qw_company_name')
        .not('studio_id', 'is', null)
        .not('studio_name', 'is', null)
        .not('qw_company_id', 'is', null)
        .not('qw_company_name', 'is', null);

      if (ordersError) {
        console.error('Error fetching order combinations:', ordersError);
      }

      // Create a set of existing distributor combinations for quick lookup
      const existingCombinations = new Set(
        (existingDistributors || []).map(d => `${d.studio_id}-${d.qw_company_id}`)
      );

      // Find unique combinations from orders that don't exist in distributors
      const uniqueOrderCombinations = [];
      const seenCombinations = new Set();

      (orderCombinations || []).forEach(order => {
        const combinationKey = `${order.studio_id}-${order.qw_company_id}`;
        if (!existingCombinations.has(combinationKey) && !seenCombinations.has(combinationKey)) {
          seenCombinations.add(combinationKey);
          uniqueOrderCombinations.push({
            id: `order-${combinationKey}`, // Temporary ID to distinguish from real distributors
            studio_id: order.studio_id,
            studio_name: order.studio_name,
            qw_company_id: order.qw_company_id,
            qw_company_name: order.qw_company_name,
            qw_pat_encrypted: null,
            created_at: '',
            updated_at: '',
            user_id: '',
            isFromOrders: true // Flag to identify these entries
          });
        }
      });

      // Combine existing distributors with new combinations from orders
      const allDistributors = [
        ...(existingDistributors || []),
        ...uniqueOrderCombinations
      ];

      setDistributors(allDistributors);
    } catch (error) {
      console.error('Error in fetchDistributors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !roleLoading) {
      fetchDistributors();
    }
  }, [user, roleLoading]);

  const handleAddDistributor = async () => {
    if (!user) return;
    
    try {
      // Simple base64 encoding for demonstration - in production, use proper encryption
      const encrypted_pat = newDistributor.qw_pat ? btoa(newDistributor.qw_pat) : null;
      
      const { error } = await supabase
        .from('distributors')
        .insert([{
          studio_id: newDistributor.studio_id,
          studio_name: newDistributor.studio_name,
          qw_company_id: newDistributor.qw_company_id,
          qw_company_name: newDistributor.qw_company_name,
          qw_pat_encrypted: encrypted_pat,
          user_id: user.id
        }]);

      if (error) {
        console.error('Error adding distributor:', error);
        toast({
          title: "Error", 
          description: "Failed to add distributor",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Distributor added successfully",
        });
        setIsAddDialogOpen(false);
        setNewDistributor({
          studio_id: "",
          studio_name: "",
          qw_company_id: "",
          qw_company_name: "",
          qw_pat: ""
        });
        fetchDistributors();
      }
    } catch (error) {
      console.error('Error in handleAddDistributor:', error);
    }
  };

  const handleUpdatePAT = async () => {
    if (!selectedDistributor || !user) return;
    
    try {
      const encrypted_pat = updatePAT ? btoa(updatePAT) : null;
      
      const { error } = await supabase
        .from('distributors')
        .update({ qw_pat_encrypted: encrypted_pat })
        .eq('id', selectedDistributor.id);

      if (error) {
        console.error('Error updating PAT:', error);
        toast({
          title: "Error",
          description: "Failed to update PAT",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "PAT updated successfully",
        });
        setIsUpdatePATDialogOpen(false);
        setUpdatePAT("");
        setSelectedDistributor(null);
        fetchDistributors();
      }
    } catch (error) {
      console.error('Error in handleUpdatePAT:', error);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const filteredAndSortedDistributors = distributors
    .filter(distributor => 
      distributor.studio_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      distributor.qw_company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      distributor.studio_id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField].toLowerCase();
      const bValue = b[sortField].toLowerCase();
      const compareResult = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });

  if (loading || roleLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Distributor Management</CardTitle>
            {hasPermission(['admin']) && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Distributor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Distributor</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="studio_id">Studio ID</Label>
                      <Input
                        id="studio_id"
                        value={newDistributor.studio_id}
                        onChange={(e) => setNewDistributor({...newDistributor, studio_id: e.target.value})}
                        placeholder="Enter studio ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="studio_name">Studio Name</Label>
                      <Input
                        id="studio_name"
                        value={newDistributor.studio_name}
                        onChange={(e) => setNewDistributor({...newDistributor, studio_name: e.target.value})}
                        placeholder="Enter studio name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="qw_company_id">QW Company ID</Label>
                      <Input
                        id="qw_company_id"
                        value={newDistributor.qw_company_id}
                        onChange={(e) => setNewDistributor({...newDistributor, qw_company_id: e.target.value})}
                        placeholder="Enter QW company ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="qw_company_name">QW Company Name</Label>
                      <Input
                        id="qw_company_name"
                        value={newDistributor.qw_company_name}
                        onChange={(e) => setNewDistributor({...newDistributor, qw_company_name: e.target.value})}
                        placeholder="Enter QW company name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="qw_pat">QW PAT (Optional)</Label>
                      <Input
                        id="qw_pat"
                        type="password"
                        value={newDistributor.qw_pat}
                        onChange={(e) => setNewDistributor({...newDistributor, qw_pat: e.target.value})}
                        placeholder="Enter QW PAT"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddDistributor}>
                        Add Distributor
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by Studio Name, Company Name, or Studio ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort('studio_id')}
                  >
                    <div className="flex items-center">
                      Studio ID
                      {getSortIcon('studio_id')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort('studio_name')}
                  >
                    <div className="flex items-center">
                      Studio Name
                      {getSortIcon('studio_name')}
                    </div>
                  </TableHead>
                  <TableHead>QW Company ID</TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort('qw_company_name')}
                  >
                    <div className="flex items-center">
                      QW Company Name
                      {getSortIcon('qw_company_name')}
                    </div>
                  </TableHead>
                  <TableHead>QW PAT</TableHead>
                  {hasPermission(['admin']) && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedDistributors.map((distributor) => (
                  <TableRow key={distributor.id}>
                    <TableCell className="font-medium">{distributor.studio_id}</TableCell>
                    <TableCell>{distributor.studio_name}</TableCell>
                    <TableCell>{distributor.qw_company_id}</TableCell>
                    <TableCell>{distributor.qw_company_name}</TableCell>
                    <TableCell>
                      <Badge variant={distributor.qw_pat_encrypted ? "secondary" : "destructive"}>
                        {distributor.qw_pat_encrypted ? "Available" : "Not Available"}
                      </Badge>
                    </TableCell>
                    {hasPermission(['admin']) && (
                      <TableCell>
                        {distributor.isFromOrders ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNewDistributor({
                                studio_id: distributor.studio_id,
                                studio_name: distributor.studio_name,
                                qw_company_id: distributor.qw_company_id,
                                qw_company_name: distributor.qw_company_name,
                                qw_pat: ""
                              });
                              setIsAddDialogOpen(true);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Distributor
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDistributor(distributor);
                              setIsUpdatePATDialogOpen(true);
                            }}
                          >
                            <Key className="h-3 w-3 mr-1" />
                            Update PAT
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {filteredAndSortedDistributors.length === 0 && (
                  <TableRow>
                    <TableCell 
                      colSpan={hasPermission(['admin']) ? 6 : 5} 
                      className="text-center text-muted-foreground py-8"
                    >
                      No distributors found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Update PAT Dialog */}
      <Dialog open={isUpdatePATDialogOpen} onOpenChange={setIsUpdatePATDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update QW PAT</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Studio: {selectedDistributor?.studio_name}</Label>
            </div>
            <div>
              <Label>Company: {selectedDistributor?.qw_company_name}</Label>
            </div>
            <div>
              <Label htmlFor="update_pat">New QW PAT</Label>
              <Input
                id="update_pat"
                type="password"
                value={updatePAT}
                onChange={(e) => setUpdatePAT(e.target.value)}
                placeholder="Enter new QW PAT"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsUpdatePATDialogOpen(false);
                setUpdatePAT("");
                setSelectedDistributor(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePAT}>
                Update PAT
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};