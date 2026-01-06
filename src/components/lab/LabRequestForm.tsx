import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

interface LabComponent {
  id: string;
  name: string;
  available_quantity: number;
  category: string | null;
}

interface SelectedComponent {
  component_id: string;
  name: string;
  quantity: number;
  max_quantity: number;
}

const PURPOSE_OPTIONS = [
  { value: 'self_learning', label: 'Self Learning' },
  { value: 'project', label: 'Project' },
  { value: 'institute_task', label: 'Institute Task' },
];

interface LabRequestFormProps {
  onSuccess: () => void;
}

export function LabRequestForm({ onSuccess }: LabRequestFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [components, setComponents] = useState<LabComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>([]);
  const [purpose, setPurpose] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [groupMembers, setGroupMembers] = useState('');
  const [additionalReason, setAdditionalReason] = useState('');

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    const { data, error } = await supabase
      .from('lab_components')
      .select('id, name, available_quantity, category')
      .gt('available_quantity', 0)
      .order('name');

    if (!error && data) {
      setComponents(data);
    }
    setLoading(false);
  };

  const handleAddComponent = (componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;
    
    if (selectedComponents.find(sc => sc.component_id === componentId)) {
      toast({
        title: 'Already Added',
        description: 'This component is already in your list.',
        variant: 'destructive'
      });
      return;
    }

    setSelectedComponents([...selectedComponents, {
      component_id: componentId,
      name: component.name,
      quantity: 1,
      max_quantity: component.available_quantity
    }]);
  };

  const handleRemoveComponent = (componentId: string) => {
    setSelectedComponents(selectedComponents.filter(sc => sc.component_id !== componentId));
  };

  const handleQuantityChange = (componentId: string, quantity: number) => {
    setSelectedComponents(selectedComponents.map(sc => 
      sc.component_id === componentId 
        ? { ...sc, quantity: Math.min(Math.max(1, quantity), sc.max_quantity) }
        : sc
    ));
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (selectedComponents.length === 0) {
      toast({
        title: 'No Components Selected',
        description: 'Please select at least one component.',
        variant: 'destructive'
      });
      return;
    }

    if (!purpose) {
      toast({
        title: 'Purpose Required',
        description: 'Please select a purpose for your request.',
        variant: 'destructive'
      });
      return;
    }

    if (!returnDate) {
      toast({
        title: 'Return Date Required',
        description: 'Please select a return date.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);

    // Create the request summary as reason
    const componentsSummary = selectedComponents
      .map(sc => `${sc.name} (Qty: ${sc.quantity})`)
      .join(', ');
    
    const fullReason = `Components: ${componentsSummary}\n\nPurpose: ${PURPOSE_OPTIONS.find(p => p.value === purpose)?.label}\n\n${additionalReason ? `Details: ${additionalReason}` : ''}`;

    // Create the lab access request
    const { data: requestData, error: requestError } = await supabase
      .from('lab_access_requests')
      .insert({
        user_id: user.id,
        reason: fullReason,
        purpose: purpose,
        return_date: returnDate,
        group_members: groupMembers || null
      })
      .select()
      .single();

    if (requestError) {
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive'
      });
      setSubmitting(false);
      return;
    }

    // Add request items
    const items = selectedComponents.map(sc => ({
      request_id: requestData.id,
      component_id: sc.component_id,
      quantity: sc.quantity
    }));

    const { error: itemsError } = await supabase
      .from('lab_request_items')
      .insert(items);

    if (itemsError) {
      toast({
        title: 'Warning',
        description: 'Request created but failed to add some items.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Request Submitted',
        description: 'Your lab access request has been submitted for admin approval.'
      });
    }

    // Reset form
    setSelectedComponents([]);
    setPurpose('');
    setReturnDate('');
    setGroupMembers('');
    setAdditionalReason('');
    setSubmitting(false);
    onSuccess();
  };

  const minDate = format(new Date(), 'yyyy-MM-dd');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            New Component Request
          </CardTitle>
          <CardDescription>
            Select components, specify quantities, and submit for approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Component Selection */}
          <div className="space-y-3">
            <Label>Select Components</Label>
            <Select onValueChange={handleAddComponent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a component to add..." />
              </SelectTrigger>
              <SelectContent>
                {components.filter(c => !selectedComponents.find(sc => sc.component_id === c.id)).map(component => (
                  <SelectItem key={component.id} value={component.id}>
                    {component.name} ({component.available_quantity} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Selected Components List */}
            {selectedComponents.length > 0 && (
              <div className="space-y-2 mt-4">
                {selectedComponents.map((sc) => (
                  <div key={sc.component_id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="flex-1 font-medium">{sc.name}</span>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Qty:</Label>
                      <Input
                        type="number"
                        min={1}
                        max={sc.max_quantity}
                        value={sc.quantity}
                        onChange={(e) => handleQuantityChange(sc.component_id, parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">/ {sc.max_quantity}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRemoveComponent(sc.component_id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <Label>Purpose *</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger>
                <SelectValue placeholder="Select purpose..." />
              </SelectTrigger>
              <SelectContent>
                {PURPOSE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Return Date */}
          <div className="space-y-2">
            <Label>Return Date *</Label>
            <Input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={minDate}
            />
          </div>

          {/* Group Members */}
          <div className="space-y-2">
            <Label>Group Members (optional)</Label>
            <Textarea
              placeholder="Enter names of group members, one per line..."
              value={groupMembers}
              onChange={(e) => setGroupMembers(e.target.value)}
              rows={3}
            />
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label>Additional Details (optional)</Label>
            <Textarea
              placeholder="Describe your project or why you need these components..."
              value={additionalReason}
              onChange={(e) => setAdditionalReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Summary Preview */}
          {selectedComponents.length > 0 && purpose && returnDate && (
            <Card className="bg-muted/30 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Request Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>
                  <span className="text-muted-foreground">Components: </span>
                  {selectedComponents.map(sc => (
                    <Badge key={sc.component_id} variant="secondary" className="mr-1">
                      {sc.name} × {sc.quantity}
                    </Badge>
                  ))}
                </div>
                <div>
                  <span className="text-muted-foreground">Purpose: </span>
                  {PURPOSE_OPTIONS.find(p => p.value === purpose)?.label}
                </div>
                <div>
                  <span className="text-muted-foreground">Return By: </span>
                  {format(new Date(returnDate), 'MMMM d, yyyy')}
                </div>
                {groupMembers && (
                  <div>
                    <span className="text-muted-foreground">Group Members: </span>
                    {groupMembers}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={handleSubmit} 
            disabled={submitting || selectedComponents.length === 0 || !purpose || !returnDate}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
