import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowUpCircle, ArrowDownCircle, Trophy, Video, UserCog, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface XPTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  reason: string | null;
  created_at: string;
  reference_id: string | null;
}

interface XPHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    user_id: string;
    full_name: string;
    xp_points: number;
  } | null;
}

export function XPHistoryDialog({ open, onOpenChange, profile }: XPHistoryDialogProps) {
  const [transactions, setTransactions] = useState<XPTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && profile) {
      fetchTransactions();
    }
  }, [open, profile]);

  const fetchTransactions = async () => {
    if (!profile) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  const getTransactionIcon = (type: string, amount: number) => {
    switch (type) {
      case 'quiz_completion':
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'video_watched':
        return <Video className="w-4 h-4 text-blue-500" />;
      case 'admin_adjustment':
        return amount > 0 
          ? <ArrowUpCircle className="w-4 h-4 text-green-500" />
          : <ArrowDownCircle className="w-4 h-4 text-red-500" />;
      case 'admin_revert':
        return <RotateCcw className="w-4 h-4 text-orange-500" />;
      case 'monthly_reset':
        return <UserCog className="w-4 h-4 text-purple-500" />;
      default:
        return amount > 0 
          ? <ArrowUpCircle className="w-4 h-4 text-green-500" />
          : <ArrowDownCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'quiz_completion':
        return 'Quiz Completed';
      case 'video_watched':
        return 'Video Watched';
      case 'admin_adjustment':
        return 'Admin Adjustment';
      case 'admin_revert':
        return 'Admin Revert';
      case 'monthly_reset':
        return 'Monthly Reset';
      default:
        return type;
    }
  };

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>XP History - {profile.full_name}</DialogTitle>
        </DialogHeader>

        <div className="text-center p-4 bg-muted rounded-lg mb-4">
          <p className="text-sm text-muted-foreground">Current XP</p>
          <p className="text-2xl font-bold">{profile.xp_points}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No XP transactions yet
          </p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="mt-0.5">
                    {getTransactionIcon(tx.transaction_type, tx.amount)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getTransactionLabel(tx.transaction_type)}
                      </Badge>
                      <span className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} XP
                      </span>
                    </div>
                    {tx.reason && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {tx.reason}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
