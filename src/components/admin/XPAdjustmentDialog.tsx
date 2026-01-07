import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, Minus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface XPAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    id: string;
    user_id: string;
    full_name: string;
    xp_points: number;
  } | null;
  onSuccess: () => void;
}

export function XPAdjustmentDialog({ open, onOpenChange, profile, onSuccess }: XPAdjustmentDialogProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'add' | 'deduct'>('add');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    if (amount === 0) {
      toast.error('Please enter an XP amount');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for this adjustment');
      return;
    }

    setSaving(true);

    try {
      const xpChange = mode === 'add' ? amount : -amount;
      const newXP = Math.max(0, profile.xp_points + xpChange);

      // Create XP transaction record
      const { error: transactionError } = await supabase
        .from('xp_transactions')
        .insert({
          user_id: profile.user_id,
          amount: xpChange,
          transaction_type: xpChange > 0 ? 'admin_adjustment' : 'admin_revert',
          reason: reason.trim(),
          created_by: user.id,
        });

      if (transactionError) throw transactionError;

      // Update profile XP
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ xp_points: newXP })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      toast.success(`${mode === 'add' ? 'Added' : 'Deducted'} ${amount} XP ${mode === 'add' ? 'to' : 'from'} ${profile.full_name}`);
      onOpenChange(false);
      setAmount(0);
      setReason('');
      onSuccess();
    } catch (error) {
      console.error('XP adjustment error:', error);
      toast.error('Failed to adjust XP');
    }

    setSaving(false);
  };

  if (!profile) return null;

  const previewXP = mode === 'add' 
    ? profile.xp_points + amount 
    : Math.max(0, profile.xp_points - amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust XP for {profile.full_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Current XP</p>
            <p className="text-2xl font-bold">{profile.xp_points}</p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'add' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setMode('add')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add XP
            </Button>
            <Button
              type="button"
              variant={mode === 'deduct' ? 'destructive' : 'outline'}
              className="flex-1"
              onClick={() => setMode('deduct')}
            >
              <Minus className="w-4 h-4 mr-2" />
              Deduct XP
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">XP Amount</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="Enter XP amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (required)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the reason for this adjustment..."
              rows={3}
            />
          </div>

          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">New XP After Adjustment</p>
            <p className={`text-2xl font-bold ${mode === 'add' ? 'text-green-600' : 'text-destructive'}`}>
              {previewXP}
              <span className="text-sm ml-2">
                ({mode === 'add' ? '+' : '-'}{amount})
              </span>
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || amount === 0 || !reason.trim()}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Adjustment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
