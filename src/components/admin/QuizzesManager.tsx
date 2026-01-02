import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Edit, ChevronDown, ChevronUp, Clock, HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type QuizDifficulty = 'easy' | 'medium' | 'hard';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  difficulty: QuizDifficulty;
  timer_per_question: number;
  total_questions: number;
  created_at: string;
}

interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  order_index: number;
  hint: string | null;
}

export function QuizzesManager() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<Record<string, QuizQuestion[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'medium' as QuizDifficulty,
    timer_per_question: 120,
    total_questions: 10,
  });
  const [saving, setSaving] = useState(false);

  // Question form state
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    hint: '',
  });

  const fetchQuizzes = async () => {
    const { data } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setQuizzes(data as Quiz[]);
    setLoading(false);
  };

  const fetchQuestions = async (quizId: string) => {
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index');
    
    if (data) {
      setQuestions(prev => ({
        ...prev,
        [quizId]: data.map(q => ({ ...q, options: q.options as string[] }))
      }));
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      difficulty: 'medium',
      timer_per_question: 120,
      total_questions: 10,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from('quizzes')
        .update({
          title: form.title,
          description: form.description || null,
          difficulty: form.difficulty,
          timer_per_question: form.timer_per_question,
          total_questions: form.total_questions,
        })
        .eq('id', editingId);

      if (error) {
        toast.error('Failed to update quiz');
      } else {
        toast.success('Quiz updated');
        setDialogOpen(false);
        setEditingId(null);
        resetForm();
        fetchQuizzes();
      }
    } else {
      const { error } = await supabase
        .from('quizzes')
        .insert({
          title: form.title,
          description: form.description || null,
          difficulty: form.difficulty,
          timer_per_question: form.timer_per_question,
          total_questions: form.total_questions,
          created_by: user?.id,
        });

      if (error) {
        toast.error('Failed to create quiz');
      } else {
        toast.success('Quiz created');
        setDialogOpen(false);
        resetForm();
        fetchQuizzes();
      }
    }
    setSaving(false);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.question.trim() || questionForm.options.some(o => !o.trim())) {
      toast.error('Please fill in all fields');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('quiz_questions').insert({
      quiz_id: selectedQuizId,
      question: questionForm.question,
      options: questionForm.options,
      correct_answer: questionForm.correct_answer,
      hint: questionForm.hint || null,
      order_index: (questions[selectedQuizId!]?.length || 0),
    });

    if (error) {
      toast.error('Failed to add question');
    } else {
      toast.success('Question added');
      setQuestionDialogOpen(false);
      setQuestionForm({ question: '', options: ['', '', '', ''], correct_answer: 0, hint: '' });
      fetchQuestions(selectedQuizId!);
    }
    setSaving(false);
  };

  const handleEdit = (quiz: Quiz) => {
    setEditingId(quiz.id);
    setForm({
      title: quiz.title,
      description: quiz.description || '',
      difficulty: quiz.difficulty,
      timer_per_question: quiz.timer_per_question,
      total_questions: quiz.total_questions,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete quiz');
    } else {
      toast.success('Quiz deleted');
      fetchQuizzes();
    }
  };

  const toggleActive = async (quiz: Quiz) => {
    const { error } = await supabase
      .from('quizzes')
      .update({ is_active: !quiz.is_active })
      .eq('id', quiz.id);
    
    if (!error) fetchQuizzes();
  };

  const deleteQuestion = async (questionId: string, quizId: string) => {
    const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId);
    if (!error) fetchQuestions(quizId);
  };

  const toggleExpand = (quizId: string) => {
    if (expandedQuiz === quizId) {
      setExpandedQuiz(null);
    } else {
      setExpandedQuiz(quizId);
      if (!questions[quizId]) {
        fetchQuestions(quizId);
      }
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const getDifficultyColor = (difficulty: QuizDifficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'hard': return 'bg-red-500/10 text-red-600 border-red-500/20';
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{quizzes.length} Quizzes</h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingId(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Quiz' : 'New Quiz'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Resistors Fundamentals"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the quiz topic"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select
                    value={form.difficulty}
                    onValueChange={(v: QuizDifficulty) => setForm({ ...form, difficulty: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_questions">Number of Questions</Label>
                  <Input
                    id="total_questions"
                    type="number"
                    min={1}
                    max={100}
                    value={form.total_questions}
                    onChange={(e) => setForm({ ...form, total_questions: parseInt(e.target.value) || 10 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Timer per Question</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={form.timer_per_question.toString()}
                    onValueChange={(v) => setForm({ ...form, timer_per_question: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="90">1.5 minutes</SelectItem>
                      <SelectItem value="120">2 minutes</SelectItem>
                      <SelectItem value="180">3 minutes</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Question</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuestionSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea
                value={questionForm.question}
                onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                placeholder="Enter your question"
              />
            </div>
            <div className="space-y-2">
              <Label>Options (select correct answer)</Label>
              {questionForm.options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...questionForm.options];
                      newOptions[idx] = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOptions });
                    }}
                    placeholder={`Option ${idx + 1}`}
                  />
                  <input
                    type="radio"
                    name="correct"
                    checked={questionForm.correct_answer === idx}
                    onChange={() => setQuestionForm({ ...questionForm, correct_answer: idx })}
                    className="w-4 h-4 accent-primary"
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Hint (optional)
              </Label>
              <Input
                value={questionForm.hint}
                onChange={(e) => setQuestionForm({ ...questionForm, hint: e.target.value })}
                placeholder="A helpful hint for students"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setQuestionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Question
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {quizzes.map((quiz) => (
          <Card key={quiz.id}>
            <Collapsible open={expandedQuiz === quiz.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <Badge variant={quiz.is_active ? 'default' : 'secondary'}>
                        {quiz.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge className={getDifficultyColor(quiz.difficulty)} variant="outline">
                        {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                      </Badge>
                    </div>
                    {quiz.description && (
                      <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTimer(quiz.timer_per_question)}/question
                      </span>
                      <span>{quiz.total_questions} questions</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={quiz.is_active} onCheckedChange={() => toggleActive(quiz)} />
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(quiz)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(quiz.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => toggleExpand(quiz.id)}>
                        {expandedQuiz === quiz.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Questions ({questions[quiz.id]?.length || 0} / {quiz.total_questions})</h4>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedQuizId(quiz.id);
                        setQuestionDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Question
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {questions[quiz.id]?.map((q, idx) => (
                      <div key={q.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">Q{idx + 1}: {q.question}</p>
                            <ul className="mt-2 space-y-1">
                              {q.options.map((opt, optIdx) => (
                                <li key={optIdx} className={`text-sm ${optIdx === q.correct_answer ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                  {optIdx === q.correct_answer ? '✓' : '○'} {opt}
                                </li>
                              ))}
                            </ul>
                            {q.hint && (
                              <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                                <HelpCircle className="w-3.5 h-3.5" />
                                Hint: {q.hint}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => deleteQuestion(q.id, quiz.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!questions[quiz.id] || questions[quiz.id].length === 0) && (
                      <p className="text-muted-foreground text-sm">No questions yet</p>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
        {quizzes.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No quizzes yet</p>
        )}
      </div>
    </div>
  );
}
