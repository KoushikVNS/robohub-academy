import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface LabComponent {
  id: string;
  name: string;
  description: string | null;
  total_quantity: number;
  available_quantity: number;
  category: string | null;
  created_at: string;
}

export function ComponentsManager() {
  const { user } = useAuth();
  const [components, setComponents] = useState<LabComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<LabComponent | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    const { data, error } = await supabase
      .from('lab_components')
      .select('*')
      .order('name');

    if (!error && data) {
      setComponents(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setTotalQuantity(1);
    setCategory('');
    setEditingComponent(null);
  };

  const openEditDialog = (component: LabComponent) => {
    setEditingComponent(component);
    setName(component.name);
    setDescription(component.description || '');
    setTotalQuantity(component.total_quantity);
    setCategory(component.category || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !user) return;

    setSaving(true);

    if (editingComponent) {
      // Update existing
      const quantityDiff = totalQuantity - editingComponent.total_quantity;
      const newAvailable = editingComponent.available_quantity + quantityDiff;

      const { error } = await supabase
        .from('lab_components')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          total_quantity: totalQuantity,
          available_quantity: Math.max(0, newAvailable),
          category: category.trim() || null
        })
        .eq('id', editingComponent.id);

      if (error) {
        toast.error('Failed to update component');
      } else {
        toast.success('Component updated');
        setDialogOpen(false);
        resetForm();
        fetchComponents();
      }
    } else {
      // Create new
      const { error } = await supabase
        .from('lab_components')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          total_quantity: totalQuantity,
          available_quantity: totalQuantity,
          category: category.trim() || null,
          created_by: user.id
        });

      if (error) {
        toast.error('Failed to create component');
      } else {
        toast.success('Component added');
        setDialogOpen(false);
        resetForm();
        fetchComponents();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this component?')) return;

    const { error } = await supabase
      .from('lab_components')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete component');
    } else {
      toast.success('Component deleted');
      fetchComponents();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Lab Components Inventory</h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Component
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingComponent ? 'Edit Component' : 'Add New Component'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Arduino Uno"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the component..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Quantity *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={totalQuantity}
                    onChange={(e) => setTotalQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Microcontrollers"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving || !name.trim()}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingComponent ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {components.map((component) => (
              <TableRow key={component.id}>
                <TableCell className="font-medium">{component.name}</TableCell>
                <TableCell>{component.category || '-'}</TableCell>
                <TableCell>
                  <span className={component.available_quantity > 0 ? 'text-green-500' : 'text-red-500'}>
                    {component.available_quantity}
                  </span>
                </TableCell>
                <TableCell>{component.total_quantity}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEditDialog(component)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(component.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {components.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No components added yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
