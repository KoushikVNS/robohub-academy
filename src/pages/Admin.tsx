import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StudentsManager } from '@/components/admin/StudentsManager';
import { AnnouncementsManager } from '@/components/admin/AnnouncementsManager';
import { QuizzesManager } from '@/components/admin/QuizzesManager';
import { LabAccessManager } from '@/components/admin/LabAccessManager';
import { VideosManager } from '@/components/admin/VideosManager';
import { Loader2, ArrowLeft, Users, Megaphone, BookOpen, Key, Video } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, user, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="students" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Students</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">Announcements</span>
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Quizzes</span>
            </TabsTrigger>
            <TabsTrigger value="lab-access" className="gap-2">
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">Lab Access</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2">
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Videos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <StudentsManager />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsManager />
          </TabsContent>

          <TabsContent value="quizzes">
            <QuizzesManager />
          </TabsContent>

          <TabsContent value="lab-access">
            <LabAccessManager />
          </TabsContent>

          <TabsContent value="videos">
            <VideosManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
