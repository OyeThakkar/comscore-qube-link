import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Search, RefreshCw, Eye, TrendingUp, Package, AlertCircle } from "lucide-react";
import StatusBadge from "./StatusBadge";

// Mock data for booking manager
const mockBookingData = [
  {
    content_id: "CNT-001",
    content_title: "Top Gun: Maverick",
    package_uuid: "pkg-001-uuid-topgun",
    cpl_list: "CPL-001-MAIN, CPL-001-TRAILER",
    booking_count: 245,
    pending_bookings: 23,
    shipped: 180,
    downloading: 15,
    completed: 165,
    cancelled: 8,
    updated_on: "2024-01-15 14:30:00",
    completion_rate: 85
  },
  {
    content_id: "CNT-002",
    content_title: "Avatar: The Way of Water",
    package_uuid: "pkg-002-uuid-avatar", 
    cpl_list: "CPL-002-MAIN, CPL-002-3D, CPL-002-IMAX",
    booking_count: 189,
    pending_bookings: 34,
    shipped: 155,
    downloading: 22,
    completed: 133,
    cancelled: 0,
    updated_on: "2024-01-14 11:20:00",
    completion_rate: 70
  },
  {
    content_id: "CNT-003",
    content_title: "Black Panther: Wakanda Forever",
    package_uuid: "pkg-003-uuid-blackpanther",
    cpl_list: "",
    booking_count: 156,
    pending_bookings: 156,
    shipped: 0,
    downloading: 0,
    completed: 0,
    cancelled: 0,
    updated_on: "2024-01-13 16:45:00",
    completion_rate: 0
  }
];

const BookingManagerTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleViewDetails = (item: any) => {
    navigate(`/delivery-details/${item.content_id}/${item.package_uuid}`);
  };

  const filteredData = mockBookingData.filter(item => 
    item.content_title.toLowerCase().includes(searchTerm.toLowerCase())
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
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
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
                {filteredData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.content_title}</TableCell>
                    <TableCell>
                      {item.cpl_list ? (
                        <Badge variant="outline" className="bg-status-success-bg text-status-success">
                          CPL Mapped
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-status-error-bg text-status-error">
                          No CPL
                        </Badge>
                      )}
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
                      {item.updated_on.split(' ')[0]}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8"
                        onClick={() => handleViewDetails(item)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingManagerTab;