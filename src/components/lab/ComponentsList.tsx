import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Package, Search } from 'lucide-react';

interface LabComponent {
  id: string;
  name: string;
  description: string | null;
  total_quantity: number;
  available_quantity: number;
  category: string | null;
}

export function ComponentsList() {
  const [components, setComponents] = useState<LabComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filteredComponents = components.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(components.map(c => c.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {components.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No components available yet.</p>
            <p className="text-sm">Check back later or contact an admin.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <Badge 
                  key={cat} 
                  variant="outline" 
                  className="cursor-pointer"
                  onClick={() => setSearch(cat || '')}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredComponents.map((component) => (
              <Card key={component.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{component.name}</h3>
                    {component.category && (
                      <Badge variant="secondary" className="text-xs">
                        {component.category}
                      </Badge>
                    )}
                  </div>
                  {component.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {component.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Available</span>
                    <span className={`font-medium ${component.available_quantity > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {component.available_quantity} / {component.total_quantity}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredComponents.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No components match your search.
            </p>
          )}
        </>
      )}
    </div>
  );
}
