import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Edit, Save, History, Search, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CplManagementTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingCpl, setEditingCpl] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cplData, setCplData] = useState<any[]>([]);
  const { toast } = useToast();

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || '';
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
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsedData = parseCSV(text);
          setCplData(parsedData);
          toast({
            title: "File uploaded successfully",
            description: `Loaded ${parsedData.length} records from ${file.name}`,
          });
        } catch (error) {
          toast({
            title: "Error parsing file",
            description: "Please check the file format and try again.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setEditingCpl(item.cpl_list);
    setDialogOpen(true);
  };

  const handleSave = () => {
    // Mock save operation
    toast({
      title: "CPL updated successfully",
      description: `Updated CPL list for content ${editingItem?.content_id}`,
    });
    setDialogOpen(false);
    setEditingItem(null);
    setEditingCpl("");
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setEditingCpl("");
  };

  const filteredData = cplData.filter(item => 
    (item.content_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.content_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.film_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload CPL Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="text-sm font-medium">
                Upload CSV File
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mt-2"
              />
            </div>
            {selectedFile && (
              <div className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Header with Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Film, Package & CPL Management
            </CardTitle>
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
        </CardHeader>
      </Card>

      {/* CPL Management Table */}
      <Card>
        <CardHeader>
          <CardTitle>Content & CPL Mapping</CardTitle>
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
                  <TableHead>Bookings</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <TableRow key={item.content_id || index}>
                      <TableCell className="font-medium">{item.content_id || '-'}</TableCell>
                      <TableCell className="font-medium">{item.content_title || '-'}</TableCell>
                      <TableCell>{item.film_id || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">{item.package_uuid || '-'}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="space-y-1">
                          {item.cpl_list ? (
                            item.cpl_list.split(',').map((cpl: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="mr-1 mb-1">
                                {cpl.trim()}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground italic">No CPLs defined</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          {item.booking_count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.updated_on ? (
                          <div>
                            <p className="text-sm">{item.updated_on.split(' ')[0]}</p>
                            <p className="text-xs text-muted-foreground">{item.updated_by}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Not updated</span>
                        )}
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
                          <Button size="sm" variant="outline" className="h-8">
                            <History className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {cplData.length === 0 ? "Please upload a CSV file to view CPL data" : "No data found matching your search"}
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