import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trophy,
  ArrowRight,
  Lightbulb,
  RotateCcw
} from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  hint: string | null;
  order_index: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  timer_per_question: number;
  total_questions: number;
}

interface QuizPlayerProps {
  quiz: Quiz;
  onClose: () => void;
}

export function QuizPlayer({ quiz, onClose }: QuizPlayerProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(quiz.timer_per_question);
  const [showHint, setShowHint] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_index', { ascending: true });

      if (error) {
        toast.error('Failed to load questions');
        onClose();
        return;
      }

      if (!data || data.length === 0) {
        toast.error('No questions found for this quiz');
        onClose();
        return;
      }

      // Parse options from JSON if needed
      const parsedQuestions = data.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string)
      }));

      setQuestions(parsedQuestions);
      setLoading(false);
    };

    fetchQuestions();
  }, [quiz.id, onClose]);

  // Timer countdown
  useEffect(() => {
    if (loading || showResult || quizCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return quiz.timer_per_question;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, showResult, quizCompleted, currentIndex]);

  const handleTimeUp = useCallback(() => {
    if (!showResult) {
      setShowResult(true);
      // Move to next question after showing result
      setTimeout(() => moveToNext(), 2000);
    }
  }, [showResult]);

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) {
      toast.error('Please select an answer');
      return;
    }

    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setShowResult(true);
    setTimeout(() => moveToNext(), 1500);
  };

  const moveToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowHint(false);
      setTimeLeft(quiz.timer_per_question);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    setQuizCompleted(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    // Save attempt to database
    if (user) {
      await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        quiz_id: quiz.id,
        score: score + (selectedAnswer === questions[currentIndex]?.correct_answer ? 1 : 0),
        total_questions: questions.length,
        time_taken_seconds: timeTaken,
      });
    }
  };

  const getScoreMessage = () => {
    const finalScore = score;
    const percentage = (finalScore / questions.length) * 100;
    
    if (percentage >= 90) return { text: "Excellent! 🎉", color: "text-green-500" };
    if (percentage >= 70) return { text: "Great job! 👏", color: "text-blue-500" };
    if (percentage >= 50) return { text: "Good effort! 💪", color: "text-yellow-500" };
    return { text: "Keep practicing! 📚", color: "text-orange-500" };
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quizCompleted) {
    const scoreMessage = getScoreMessage();
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
            <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className={`text-3xl font-bold ${scoreMessage.color}`}>
                {score} / {questions.length}
              </p>
              <p className={`text-lg mt-2 ${scoreMessage.color}`}>
                {scoreMessage.text}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Accuracy</span>
                <span>{Math.round((score / questions.length) * 100)}%</span>
              </div>
              <Progress value={(score / questions.length) * 100} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Back to Quizzes
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => {
                  setCurrentIndex(0);
                  setScore(0);
                  setSelectedAnswer(null);
                  setShowResult(false);
                  setQuizCompleted(false);
                  setTimeLeft(quiz.timer_per_question);
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">{quiz.title}</Badge>
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-destructive animate-pulse' : ''}`} />
              <span className={`font-mono ${timeLeft <= 10 ? 'text-destructive font-bold' : ''}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>Score: {score}</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <h3 className="text-xl font-semibold">{currentQuestion.question}</h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = "w-full justify-start text-left h-auto py-3 px-4";
              
              if (showResult) {
                if (index === currentQuestion.correct_answer) {
                  buttonClass += " bg-green-500/20 border-green-500 text-green-700 dark:text-green-400";
                } else if (index === selectedAnswer && index !== currentQuestion.correct_answer) {
                  buttonClass += " bg-destructive/20 border-destructive text-destructive";
                }
              } else if (selectedAnswer === index) {
                buttonClass += " border-primary bg-primary/10";
              }

              return (
                <Button
                  key={index}
                  variant="outline"
                  className={buttonClass}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full border flex items-center justify-center text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option}</span>
                    {showResult && index === currentQuestion.correct_answer && (
                      <CheckCircle2 className="w-5 h-5 ml-auto text-green-500" />
                    )}
                    {showResult && index === selectedAnswer && index !== currentQuestion.correct_answer && (
                      <XCircle className="w-5 h-5 ml-auto text-destructive" />
                    )}
                  </span>
                </Button>
              );
            })}
          </div>

          {currentQuestion.hint && !showResult && (
            <div>
              {showHint ? (
                <div className="p-3 rounded-lg bg-muted text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Lightbulb className="w-4 h-4" />
                    <span className="font-medium">Hint</span>
                  </div>
                  <p>{currentQuestion.hint}</p>
                </div>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowHint(true)}
                  className="text-muted-foreground"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Show Hint
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Exit Quiz
            </Button>
            {!showResult && (
              <Button 
                className="flex-1" 
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
              >
                Submit Answer
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
