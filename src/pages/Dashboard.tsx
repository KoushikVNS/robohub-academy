import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bot, 
  LogOut, 
  Video, 
  MessageSquare, 
  Trophy, 
  Wrench,
  BookOpen,
  Users,
  Zap,
  ChevronRight
} from 'lucide-react';

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();

  const quickStats = [
    { label: 'Videos Watched', value: '0', icon: Video, color: 'text-primary' },
    { label: 'Quizzes Completed', value: '0', icon: BookOpen, color: 'text-secondary' },
    { label: 'XP Points', value: '0', icon: Zap, color: 'text-accent' },
    { label: 'Rank', value: '-', icon: Trophy, color: 'text-robot-orange' },
  ];

  const features = [
    {
      title: 'Learning Hub',
      description: 'Watch tutorials, take quizzes, and earn XP',
      icon: Video,
      color: 'bg-primary/10 text-primary',
      href: '/learn',
    },
    {
      title: 'Community Chat',
      description: 'Connect with fellow robotics enthusiasts',
      icon: MessageSquare,
      color: 'bg-secondary/10 text-secondary',
      href: '/chat',
    },
    {
      title: 'Lab Access',
      description: 'Request components for your projects',
      icon: Wrench,
      color: 'bg-accent/10 text-accent',
      href: '/lab',
    },
    {
      title: 'Leaderboard',
      description: 'See how you rank among members',
      icon: Trophy,
      color: 'bg-robot-orange/10 text-robot-orange',
      href: '/leaderboard',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-display font-bold">RoboClub</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">Batch {profile?.batch_number}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Ready to build something amazing today?
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat) => (
            <Card key={stat.label} className="border-border/50">
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
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <h2 className="text-xl font-display font-semibold mb-4">Explore Features</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {features.map((feature) => (
            <Card 
              key={feature.title} 
              className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer group"
            >
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
            </Card>
          ))}
        </div>

        {/* Announcements Placeholder */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Latest Announcements
            </CardTitle>
            <CardDescription>Stay updated with club news</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No announcements yet. Check back soon!</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
