import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  ArrowLeft,
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';

interface LabRequest {
  id: string;
  reason: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export default function LabAccess() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('lab_access_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !reason.trim()) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('lab_access_requests')
      .insert({
        user_id: user.id,
        reason: reason.trim()
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Request Submitted',
        description: 'Your lab access request has been submitted for review.'
      });
      setReason('');
      setShowForm(false);
      fetchRequests();
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-display font-bold">Lab Access</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">Lab Access Requests</h1>
            <p className="text-muted-foreground">
              Request access to lab components and equipment for your projects.
            </p>
          </div>

          {/* New Request Button */}
          {!showForm && (
            <Button 
              onClick={() => setShowForm(true)} 
              className="mb-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          )}

          {/* New Request Form */}
          {showForm && (
            <Card className="border-border/50 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" />
                  New Lab Access Request
                </CardTitle>
                <CardDescription>
                  Describe what components or equipment you need and why
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="E.g., I need an Arduino Uno and 5 LEDs for my automatic plant watering project..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitting || !reason.trim()}
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => { setShowForm(false); setReason(''); }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Requests List */}
          <h2 className="text-xl font-semibold mb-4">Your Requests</h2>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>You haven't made any lab access requests yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-foreground mb-2">{request.reason}</p>
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
          )}
        </div>
      </main>
    </div>
  );
}
