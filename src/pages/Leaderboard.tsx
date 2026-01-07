import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Bot, 
  ArrowLeft,
  Trophy,
  Medal,
  Zap,
  Crown,
  Calendar
} from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  full_name: string;
  avatar_url: string | null;
  batch_number: string;
  xp_points: number;
  user_id: string;
}

interface MonthlyWinner {
  id: string;
  user_id: string;
  full_name: string;
  xp_points: number;
  rank: number;
  month: number;
  year: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [previousWinners, setPreviousWinners] = useState<MonthlyWinner[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch current leaderboard
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, batch_number, xp_points, user_id')
        .order('xp_points', { ascending: false })
        .limit(50);

      if (!error && data) {
        setLeaderboard(data);
        
        // Find current user's rank
        if (user) {
          const rank = data.findIndex(entry => entry.user_id === user.id);
          if (rank !== -1) {
            setUserRank(rank + 1);
          }
        }
      }
      setLoading(false);

      // Fetch previous month winners
      const { data: winners } = await supabase
        .from('monthly_leaderboard_snapshots')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .order('rank', { ascending: true })
        .limit(12); // Get last 4 months x 3 winners

      if (winners) {
        setPreviousWinners(winners);
      }
      setLoadingWinners(false);
    };

    fetchData();
  }, [user]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 text-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 2:
        return 'bg-gray-400/10 border-gray-400/30';
      case 3:
        return 'bg-amber-600/10 border-amber-600/30';
      default:
        return 'border-border/50';
    }
  };

  // Group previous winners by month/year
  const groupedWinners = previousWinners.reduce((acc, winner) => {
    const key = `${winner.year}-${winner.month}`;
    if (!acc[key]) {
      acc[key] = {
        month: winner.month,
        year: winner.year,
        winners: []
      };
    }
    acc[key].winners.push(winner);
    return acc;
  }, {} as Record<string, { month: number; year: number; winners: MonthlyWinner[] }>);

  const sortedMonths = Object.values(groupedWinners).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  // Get current month info for reset message
  const now = new Date();
  const nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysUntilReset = Math.ceil((nextResetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

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
            <span className="text-xl font-display font-bold">Leaderboard</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-display font-bold mb-2">
              <Trophy className="w-8 h-8 inline-block mr-2 text-primary" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Top members ranked by XP points
            </p>
            {userRank && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Your Rank: #{userRank}</span>
              </div>
            )}
          </div>

          <Tabs defaultValue="current" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                This Month
              </TabsTrigger>
              <TabsTrigger value="previous" className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Previous Winners
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current">
              <div className="mb-4 p-3 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 inline-block mr-1" />
                XP resets in {daysUntilReset} days • Top 3 will be recorded!
              </div>

              {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading leaderboard...
                </div>
              ) : leaderboard.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No rankings yet. Start earning XP to appear here!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => {
                    const rank = index + 1;
                    const isCurrentUser = user && entry.user_id === user.id;
                    
                    return (
                      <Card 
                        key={entry.id} 
                        className={`border ${getRankStyle(rank)} ${isCurrentUser ? 'ring-2 ring-primary' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-8 flex justify-center">
                              {getRankIcon(rank)}
                            </div>
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={entry.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {entry.full_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">
                                {entry.full_name}
                                {isCurrentUser && <span className="ml-2 text-xs text-primary">(You)</span>}
                              </p>
                              <p className="text-sm text-muted-foreground">Batch {entry.batch_number}</p>
                            </div>
                            <div className="flex items-center gap-1 text-primary font-bold">
                              <Zap className="w-4 h-4" />
                              {entry.xp_points.toLocaleString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="previous">
              {loadingWinners ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading previous winners...
                </div>
              ) : sortedMonths.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No previous month data yet. Winners will appear after the first monthly reset!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {sortedMonths.map(({ month, year, winners }) => (
                    <Card key={`${year}-${month}`} className="border-border/50">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-primary" />
                          {MONTH_NAMES[month - 1]} {year}
                        </h3>
                        <div className="space-y-3">
                          {winners.sort((a, b) => a.rank - b.rank).map((winner) => (
                            <div 
                              key={winner.id}
                              className={`flex items-center gap-4 p-3 rounded-lg ${getRankStyle(winner.rank)}`}
                            >
                              <div className="w-8 flex justify-center">
                                {getRankIcon(winner.rank)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{winner.full_name}</p>
                              </div>
                              <div className="flex items-center gap-1 text-primary font-bold">
                                <Zap className="w-4 h-4" />
                                {winner.xp_points.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
