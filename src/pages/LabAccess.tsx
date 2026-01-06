import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, ArrowLeft, Package, ClipboardList, History } from 'lucide-react';
import { ComponentsList } from '@/components/lab/ComponentsList';
import { LabRequestForm } from '@/components/lab/LabRequestForm';
import { MyRequests } from '@/components/lab/MyRequests';

export default function LabAccess() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('components');

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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">Lab Components & Access</h1>
            <p className="text-muted-foreground">
              Browse available components and request access for your projects.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="components" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Components</span>
              </TabsTrigger>
              <TabsTrigger value="request" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Request Access</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">My Requests</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="components">
              <ComponentsList />
            </TabsContent>

            <TabsContent value="request">
              <LabRequestForm onSuccess={() => setActiveTab('history')} />
            </TabsContent>

            <TabsContent value="history">
              <MyRequests />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
