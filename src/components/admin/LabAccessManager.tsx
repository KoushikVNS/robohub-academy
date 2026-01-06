import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Check, X, RotateCcw, Package, ClipboardList } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ComponentsManager } from './ComponentsManager';
import { format } from 'date-fns';

interface RequestItem {
  id: string;
  quantity: number;
  is_returned: boolean;
  component: {
    id: string;
    name: string;
  };
}

interface LabRequest {
  id: string;
  user_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  purpose: string | null;
  return_date: string | null;
  group_members: string | null;
  admin_notes: string | null;
  items_returned: boolean;
  created_at: string;
  reviewed_at: string | null;
  profile?: {
    full_name: string;
    enrollment_id: string;
  };
  items?: RequestItem[];
}

export function LabAccessManager() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('lab_access_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      // Fetch profiles for each request
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, enrollment_id')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      
      // Fetch items for each request
      const requestsWithData = await Promise.all(
        data.map(async (request) => {
          const { data: items } = await supabase
            .from('lab_request_items')
            .select(`
              id,
              quantity,
              is_returned,
              component:lab_components(id, name)
            `)
            .eq('request_id', request.id);

          return {
            ...request,
            status: request.status as 'pending' | 'approved' | 'rejected',
            profile: profileMap.get(request.user_id),
            items: items?.map(item => ({
              ...item,
              component: Array.isArray(item.component) ? item.component[0] : item.component
            })) || []
          };
        })
      );
      
      setRequests(requestsWithData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (action: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    
    // If approving, decrease available quantities
    if (action === 'approved' && selectedRequest.items) {
      for (const item of selectedRequest.items) {
        const { data: comp } = await supabase
          .from('lab_components')
          .select('available_quantity')
          .eq('id', item.component.id)
          .single();
        
        if (comp) {
          await supabase
            .from('lab_components')
            .update({ available_quantity: Math.max(0, comp.available_quantity - item.quantity) })
            .eq('id', item.component.id);
        }
      }
    }

    const { error } = await supabase
      .from('lab_access_requests')
      .update({
        status: action,
        admin_notes: adminNotes || null,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', selectedRequest.id);

    if (error) {
      toast.error(`Failed to ${action} request`);
    } else {
      toast.success(`Request ${action}`);
      setSelectedRequest(null);
      setAdminNotes('');
      fetchRequests();
    }
    setProcessing(false);
  };

  const handleMarkReturned = async (request: LabRequest) => {
    if (!confirm('Mark all items as returned?')) return;

    setProcessing(true);

    // Increase available quantities back
    if (request.items) {
      for (const item of request.items) {
        const { data: comp } = await supabase
          .from('lab_components')
          .select('available_quantity, total_quantity')
          .eq('id', item.component.id)
          .single();
        
        if (comp) {
          await supabase
            .from('lab_components')
            .update({ 
              available_quantity: Math.min(comp.total_quantity, comp.available_quantity + item.quantity) 
            })
            .eq('id', item.component.id);
        }

        // Mark item as returned
        await supabase
          .from('lab_request_items')
          .update({ is_returned: true, returned_at: new Date().toISOString() })
          .eq('id', item.id);
      }
    }

    // Mark request as returned
    const { error } = await supabase
      .from('lab_access_requests')
      .update({ 
        items_returned: true, 
        returned_at: new Date().toISOString() 
      })
      .eq('id', request.id);

    if (error) {
      toast.error('Failed to mark as returned');
    } else {
      toast.success('Items marked as returned');
      fetchRequests();
    }
    setProcessing(false);
  };

  const getStatusBadge = (status: string, itemsReturned: boolean) => {
    if (status === 'approved' && itemsReturned) {
      return <Badge className="bg-blue-500">Returned</Badge>;
    }
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getPurposeLabel = (purpose: string | null) => {
    switch (purpose) {
      case 'self_learning': return 'Self Learning';
      case 'project': return 'Project';
      case 'institute_task': return 'Institute Task';
      default: return purpose || '-';
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const ongoingCount = requests.filter(r => r.status === 'approved' && !r.items_returned).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Requests
            {pendingCount > 0 && <Badge variant="destructive" className="ml-1">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="ongoing" className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Ongoing
            {ongoingCount > 0 && <Badge variant="secondary" className="ml-1">{ongoingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="components" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Components
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Review Request</DialogTitle>
              </DialogHeader>
              {selectedRequest && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Student</p>
                    <p className="font-medium">{selectedRequest.profile?.full_name || 'Unknown'}</p>
                    <p className="text-sm">{selectedRequest.profile?.enrollment_id}</p>
                  </div>
                  
                  {selectedRequest.items && selectedRequest.items.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Components Requested</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedRequest.items.map((item) => (
                          <Badge key={item.id} variant="secondary">
                            {item.component?.name} × {item.quantity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Purpose</p>
                      <p>{getPurposeLabel(selectedRequest.purpose)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Return Date</p>
                      <p>{selectedRequest.return_date ? format(new Date(selectedRequest.return_date), 'MMM d, yyyy') : '-'}</p>
                    </div>
                  </div>

                  {selectedRequest.group_members && (
                    <div>
                      <p className="text-sm text-muted-foreground">Group Members</p>
                      <p className="whitespace-pre-line">{selectedRequest.group_members}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Admin Notes (optional)</p>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this decision..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => handleAction('rejected')}
                      disabled={processing}
                    >
                      {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleAction('approved')}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.profile?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{request.profile?.enrollment_id || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {request.items?.slice(0, 2).map((item) => (
                          <Badge key={item.id} variant="outline" className="text-xs">
                            {item.component?.name} ×{item.quantity}
                          </Badge>
                        ))}
                        {(request.items?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(request.items?.length || 0) - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPurposeLabel(request.purpose)}</TableCell>
                    <TableCell>
                      {request.return_date ? format(new Date(request.return_date), 'MMM d') : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status, request.items_returned)}</TableCell>
                    <TableCell className="text-right">
                      {request.status === 'pending' ? (
                        <Button size="sm" onClick={() => setSelectedRequest(request)}>
                          Review
                        </Button>
                      ) : request.status === 'approved' && !request.items_returned ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleMarkReturned(request)}
                          disabled={processing}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Return
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {request.items_returned ? 'Returned' : 'Reviewed'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No lab access requests
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="ongoing" className="mt-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead>Borrowed On</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests
                  .filter(r => r.status === 'approved' && !r.items_returned)
                  .map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.profile?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{request.profile?.enrollment_id || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {request.items?.map((item) => (
                            <Badge key={item.id} variant="secondary" className="text-xs">
                              {item.component?.name} ×{item.quantity}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.reviewed_at ? format(new Date(request.reviewed_at), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {request.return_date ? (
                          <span className={new Date(request.return_date) < new Date() ? 'text-red-500 font-medium' : ''}>
                            {format(new Date(request.return_date), 'MMM d, yyyy')}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {request.group_members || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleMarkReturned(request)}
                          disabled={processing}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Mark Returned
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {requests.filter(r => r.status === 'approved' && !r.items_returned).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No ongoing borrows
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="components" className="mt-4">
          <ComponentsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
