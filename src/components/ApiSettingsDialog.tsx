import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, TestTube, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { qubeWireApi } from "@/services/qubeWireApi";

const ApiSettingsDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Load saved token from localStorage
    const savedToken = localStorage.getItem('qube_wire_token');
    if (savedToken) {
      setToken(savedToken);
      qubeWireApi.setToken(savedToken);
    }
  }, []);

  const handleSaveToken = () => {
    if (!token.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Personal Access Token",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('qube_wire_token', token);
    qubeWireApi.setToken(token);
    setConnectionStatus('idle');
    
    toast({
      title: "Success",
      description: "Personal Access Token saved successfully"
    });
  };

  const handleTestConnection = async () => {
    if (!token.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Personal Access Token first",
        variant: "destructive"
      });
      return;
    }

    setIsTestingConnection(true);
    qubeWireApi.setToken(token);

    try {
      const result = await qubeWireApi.testConnection();
      setConnectionStatus(result.success ? 'success' : 'error');
      setConnectionMessage(result.message);
      
      toast({
        title: result.success ? "Connection Successful" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error: any) {
      setConnectionStatus('error');
      setConnectionMessage(error.message || 'Connection test failed');
      toast({
        title: "Connection Failed",
        description: error.message || 'Unable to test connection',
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    const hasToken = token.trim().length > 0;
    
    if (!hasToken) {
      return <Badge variant="outline" className="bg-gray-100">Not Configured</Badge>;
    }
    
    switch (connectionStatus) {
      case 'success':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Connection Error</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Not Tested</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          API Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Qube Wire API Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="environment">Environment</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {import.meta.env.VITE_QUBE_WIRE_ENVIRONMENT === 'production' ? 'Production' : 'Test'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {import.meta.env.VITE_QUBE_WIRE_ENVIRONMENT === 'production' 
                  ? 'api.services.qubewire.com' 
                  : 'api.jupiter.staging.qubewire.com'
                }
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Personal Access Token (PAT)</Label>
            <Input
              id="token"
              type="password"
              placeholder="Enter your Qube Wire PAT..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Generate your PAT from Qube Wire Settings → Company Profile → Personal Access Token
            </p>
          </div>

          <div className="space-y-2">
            <Label>Connection Status</Label>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              {getStatusBadge()}
            </div>
            {connectionMessage && (
              <p className="text-xs text-muted-foreground">
                {connectionMessage}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveToken} className="flex-1">
              Save Token
            </Button>
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="gap-2"
            >
              <TestTube className={`h-4 w-4 ${isTestingConnection ? 'animate-spin' : ''}`} />
              Test Connection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiSettingsDialog;