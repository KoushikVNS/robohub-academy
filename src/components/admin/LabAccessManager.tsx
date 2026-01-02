import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LabRequest {
  id: string;
  user_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  profile?: {
    full_name: string;
    enrollment_id: string;
  };
}

export function LabAccessManager() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

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
      
      const requestsWithProfiles = data.map(r => ({
        ...r,
        status: r.status as 'pending' | 'approved' | 'rejected',
        profile: profileMap.get(r.user_id),
      }));
      
      setRequests(requestsWithProfiles);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (action: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    
    setProcessing(true);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-medium">Lab Access Requests</h3>
        {pendingCount > 0 && (
          <Badge variant="destructive">{pendingCount} pending</Badge>
        )}
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent>
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
              <div>
                <p className="text-sm text-muted-foreground">Reason</p>
                <p>{selectedRequest.reason}</p>
              </div>
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
              <TableHead>Enrollment ID</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {request.profile?.full_name || 'Unknown'}
                </TableCell>
                <TableCell>{request.profile?.enrollment_id || '-'}</TableCell>
                <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {request.status === 'pending' ? (
                    <Button size="sm" onClick={() => setSelectedRequest(request)}>
                      Review
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">Reviewed</span>
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
    </div>
  );
}
