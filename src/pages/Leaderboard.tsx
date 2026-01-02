import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Bot, 
  ArrowLeft,
  Trophy,
  Medal,
  Zap,
  Crown
} from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  full_name: string;
  avatar_url: string | null;
  batch_number: string;
  xp_points: number;
  user_id: string;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
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
    };

    fetchLeaderboard();
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
        </div>
      </main>
    </div>
  );
}
