import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, CheckCircle, XCircle, Package, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

interface RequestItem {
  id: string;
  quantity: number;
  is_returned: boolean;
  component: {
    name: string;
  };
}

interface LabRequest {
  id: string;
  reason: string;
  status: string;
  purpose: string | null;
  return_date: string | null;
  group_members: string | null;
  admin_notes: string | null;
  items_returned: boolean;
  created_at: string;
  reviewed_at: string | null;
  items?: RequestItem[];
}

export function MyRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    const { data: requestsData, error } = await supabase
      .from('lab_access_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && requestsData) {
      // Fetch items for each request
      const requestsWithItems = await Promise.all(
        requestsData.map(async (request) => {
          const { data: items } = await supabase
            .from('lab_request_items')
            .select(`
              id,
              quantity,
              is_returned,
              component:lab_components(name)
            `)
            .eq('request_id', request.id);

          return {
            ...request,
            items: items?.map(item => ({
              ...item,
              component: Array.isArray(item.component) ? item.component[0] : item.component
            })) || []
          };
        })
      );
      setRequests(requestsWithItems);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string, itemsReturned: boolean) => {
    if (status === 'approved' && itemsReturned) {
      return <Badge className="bg-blue-500/10 text-blue-500"><RotateCcw className="w-3 h-3 mr-1" /> Returned</Badge>;
    }
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>You haven't made any lab access requests yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
              </span>
              {getStatusBadge(request.status, request.items_returned)}
            </div>

            {/* Items List */}
            {request.items && request.items.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-muted-foreground mb-1">Components:</p>
                <div className="flex flex-wrap gap-1">
                  {request.items.map((item) => (
                    <Badge key={item.id} variant="secondary">
                      {item.component?.name} × {item.quantity}
                      {item.is_returned && <CheckCircle className="w-3 h-3 ml-1 text-green-500" />}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              {request.purpose && (
                <div>
                  <span className="text-muted-foreground">Purpose: </span>
                  {getPurposeLabel(request.purpose)}
                </div>
              )}
              {request.return_date && (
                <div>
                  <span className="text-muted-foreground">Return by: </span>
                  {format(new Date(request.return_date), 'MMM d, yyyy')}
                </div>
              )}
            </div>

            {request.group_members && (
              <div className="text-sm mb-3">
                <span className="text-muted-foreground">Group: </span>
                {request.group_members}
              </div>
            )}

            {request.admin_notes && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">Admin Notes:</p>
                <p className="text-sm">{request.admin_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
