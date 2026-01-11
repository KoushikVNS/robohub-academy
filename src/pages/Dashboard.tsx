import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Video, MessageSquare, Trophy, Wrench, BookOpen, Zap, ChevronRight, Settings, User, Bell, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import roboClubLogo from '@/assets/roboclub-logo.png';
import { Walkthrough } from '@/components/Walkthrough';
interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}
interface DashboardStats {
  videosWatched: number;
  quizzesCompleted: number;
  xpPoints: number;
  rank: number | null;
}
const WALKTHROUGH_KEY = 'chintan_core_walkthrough_completed';
export default function Dashboard() {
  const {
    user,
    profile,
    signOut
  } = useAuth();
  const {
    isAdmin
  } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    videosWatched: 0,
    quizzesCompleted: 0,
    xpPoints: 0,
    rank: null
  });
  const [runWalkthrough, setRunWalkthrough] = useState(false);

  // Check if user should see walkthrough (new signup or manual trigger)
  useEffect(() => {
    const hasCompletedWalkthrough = localStorage.getItem(WALKTHROUGH_KEY);
    const isNewSignup = location.state?.newSignup;
    if (isNewSignup || !hasCompletedWalkthrough) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setRunWalkthrough(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);
  const handleWalkthroughComplete = () => {
    setRunWalkthrough(false);
    localStorage.setItem(WALKTHROUGH_KEY, 'true');
  };
  const startWalkthrough = () => {
    setRunWalkthrough(true);
  };
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      // Fetch all data in parallel
      const [announcementsRes, videosRes, quizzesRes, rankRes] = await Promise.all([
      // Announcements
      supabase.from('announcements').select('id, title, content, created_at').order('created_at', {
        ascending: false
      }).limit(5),
      // Videos watched count
      supabase.from('video_watch_history').select('id', {
        count: 'exact',
        head: true
      }).eq('user_id', user.id),
      // Quizzes completed count
      supabase.from('quiz_attempts').select('id', {
        count: 'exact',
        head: true
      }).eq('user_id', user.id),
      // Get rank by counting users with more XP
      supabase.from('profiles').select('xp_points').gt('xp_points', profile?.xp_points || 0)]);
      if (!announcementsRes.error && announcementsRes.data) {
        setAnnouncements(announcementsRes.data);
      }
      setStats({
        videosWatched: videosRes.count || 0,
        quizzesCompleted: quizzesRes.count || 0,
        xpPoints: profile?.xp_points || 0,
        rank: rankRes.data ? rankRes.data.length + 1 : null
      });
      setLoading(false);
    };
    fetchDashboardData();
  }, [user, profile?.xp_points]);
  const quickStats = [{
    label: 'Videos Watched',
    value: stats.videosWatched.toString(),
    icon: Video,
    color: 'text-primary'
  }, {
    label: 'Quizzes Completed',
    value: stats.quizzesCompleted.toString(),
    icon: BookOpen,
    color: 'text-secondary'
  }, {
    label: 'XP Points',
    value: stats.xpPoints.toString(),
    icon: Zap,
    color: 'text-accent'
  }, {
    label: 'Rank',
    value: stats.rank ? `#${stats.rank}` : '-',
    icon: Trophy,
    color: 'text-robot-orange'
  }];
  const features = [{
    title: 'Learning Hub',
    description: 'Watch tutorials, take quizzes, and earn XP',
    icon: Video,
    color: 'bg-primary/10 text-primary',
    href: '/learn',
    tourId: 'learning-hub'
  }, {
    title: 'Community Chat',
    description: 'Connect with fellow robotics enthusiasts',
    icon: MessageSquare,
    color: 'bg-secondary/10 text-secondary',
    href: '/chat',
    tourId: 'community-chat'
  }, {
    title: 'Lab Access',
    description: 'Request components for your projects',
    icon: Wrench,
    color: 'bg-accent/10 text-accent',
    href: '/lab',
    tourId: 'lab-access'
  }, {
    title: 'Leaderboard',
    description: 'See how you rank among members',
    icon: Trophy,
    color: 'bg-robot-orange/10 text-robot-orange',
    href: '/leaderboard',
    tourId: 'leaderboard'
  }, {
    title: 'About Us',
    description: 'Meet our amazing team members',
    icon: User,
    color: 'bg-purple-500/10 text-purple-500',
    href: '/about',
    tourId: 'about-us'
  }];
  return <div className="min-h-screen bg-background">
      {/* Walkthrough Component */}
      <Walkthrough run={runWalkthrough} onComplete={handleWalkthroughComplete} />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img 
                src={roboClubLogo} 
                alt="RoboClub Logo" 
                width={40}
                height={40}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover" 
              />
            </div>
            <span className="text-xl font-display font-bold text-accent">त्रिnetraCore</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">Batch {profile?.batch_number}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={startWalkthrough} title="Start Tour" data-tour="help">
              <HelpCircle className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} data-tour="profile">
              <User className="w-5 h-5" />
            </Button>
            {isAdmin && <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>}
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2 text-primary">
            Welcome back, {profile?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Ready to build something amazing today?
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" data-tour="stats">
          {quickStats.map(stat => <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Features Grid */}
        <h2 className="text-xl font-display font-semibold mb-4">Explore Features</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {features.map(feature => <Card key={feature.title} className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => navigate(feature.href)} data-tour={feature.tourId}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Announcements Section */}
        <Card className="border-border/50" data-tour="announcements">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Latest Announcements
            </CardTitle>
            <CardDescription>Stay updated with club news</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="text-center py-8 text-muted-foreground">
                <p>Loading announcements...</p>
              </div> : announcements.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                <p>No announcements yet. Check back soon!</p>
              </div> : <div className="space-y-4">
                {announcements.map(announcement => <div key={announcement.id} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-foreground">{announcement.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{announcement.content}</p>
                  </div>)}
              </div>}
          </CardContent>
        </Card>
      </main>
    </div>;
}