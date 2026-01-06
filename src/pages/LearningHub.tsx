import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { QuizPlayer } from '@/components/quiz/QuizPlayer';
import { 
  Bot, 
  ArrowLeft,
  Video as VideoIcon,
  BookOpen,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  total_questions: number;
  timer_per_question: number;
  is_active: boolean;
  created_at: string;
}

// Extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export default function LearningHub() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      const [videosRes, quizzesRes] = await Promise.all([
        supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('quizzes')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      ]);

      if (videosRes.data) setVideos(videosRes.data);
      if (quizzesRes.data) setQuizzes(quizzesRes.data);
      setLoading(false);
    };

    fetchContent();
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/10 text-green-500';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500';
      case 'hard': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <>
      {activeQuiz && (
        <QuizPlayer quiz={activeQuiz} onClose={() => setActiveQuiz(null)} />
      )}
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
            <span className="text-xl font-display font-bold">Learning Hub</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Learning Hub</h1>
          <p className="text-muted-foreground">
            Watch tutorials, take quizzes, and level up your robotics skills!
          </p>
        </div>

        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <VideoIcon className="w-4 h-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Quizzes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading videos...
              </div>
            ) : videos.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <VideoIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No videos available yet. Check back soon!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => {
                  const videoId = getYouTubeVideoId(video.video_url);
                  return (
                    <Card key={video.id} className="border-border/50 overflow-hidden hover:border-primary/50 transition-colors">
                      <div className="aspect-video bg-muted">
                        {videoId ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <VideoIcon className="w-12 h-12 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-1 line-clamp-1">{video.title}</h3>
                        {video.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {video.description}
                          </p>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(video.created_at), 'MMM d, yyyy')}
                        </span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="quizzes">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading quizzes...
              </div>
            ) : quizzes.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No quizzes available yet. Check back soon!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {quizzes.map((quiz) => (
                  <Card key={quiz.id} className="border-border/50 hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{quiz.title}</CardTitle>
                          {quiz.description && (
                            <CardDescription className="mt-1">
                              {quiz.description}
                            </CardDescription>
                          )}
                        </div>
                        <Badge className={getDifficultyColor(quiz.difficulty)}>
                          {quiz.difficulty}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {quiz.total_questions} questions
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {quiz.timer_per_question}s per question
                        </div>
                      </div>
                      <Button className="w-full" onClick={() => setActiveQuiz(quiz)}>
                        Start Quiz
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </>
  );
}
