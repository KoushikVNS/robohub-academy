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
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface QuestionFormData {
  question: string;
  options: string[];
  hint: string;
  correct_answer: number;
}

export function QuizzesManager() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<Record<string, QuizQuestion[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [step, setStep] = useState<'details' | 'questions'>('details');
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'medium' as QuizDifficulty,
    timer_per_question: 120,
    total_questions: 5,
  });
  const [questionsForm, setQuestionsForm] = useState<QuestionFormData[]>([]);
  const [saving, setSaving] = useState(false);

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
      total_questions: 5,
    });
    setQuestionsForm([]);
    setStep('details');
  };

  const initializeQuestionForms = () => {
    const forms: QuestionFormData[] = Array.from({ length: form.total_questions }, () => ({
      question: '',
      options: ['', '', '', ''],
      hint: '',
      correct_answer: 0,
    }));
    setQuestionsForm(forms);
    setStep('questions');
  };

  const updateQuestionForm = (index: number, field: keyof QuestionFormData, value: string | number | string[]) => {
    setQuestionsForm(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestionsForm(prev => {
      const updated = [...prev];
      const newOptions = [...updated[questionIndex].options];
      newOptions[optionIndex] = value;
      updated[questionIndex] = { ...updated[questionIndex], options: newOptions };
      return updated;
    });
  };

  const handleSubmit = async () => {
    // Validate all questions
    for (let i = 0; i < questionsForm.length; i++) {
      const q = questionsForm[i];
      if (!q.question.trim()) {
        toast.error(`Question ${i + 1} is empty`);
        return;
      }
      if (q.options.some(o => !o.trim())) {
        toast.error(`All options are required for Question ${i + 1}`);
        return;
      }
    }

    setSaving(true);

    try {
      if (editingId) {
        // Update quiz
        const { error: quizError } = await supabase
          .from('quizzes')
          .update({
            title: form.title,
            description: form.description || null,
            difficulty: form.difficulty,
            timer_per_question: form.timer_per_question,
            total_questions: form.total_questions,
          })
          .eq('id', editingId);

        if (quizError) throw quizError;

        // Delete existing questions
        await supabase.from('quiz_questions').delete().eq('quiz_id', editingId);

        // Insert new questions
        const questionsToInsert = questionsForm.map((q, idx) => ({
          quiz_id: editingId,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          hint: q.hint || null,
          order_index: idx,
        }));

        const { error: questionsError } = await supabase.from('quiz_questions').insert(questionsToInsert);
        if (questionsError) throw questionsError;

        toast.success('Quiz updated successfully');
      } else {
        // Create new quiz
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .insert({
            title: form.title,
            description: form.description || null,
            difficulty: form.difficulty,
            timer_per_question: form.timer_per_question,
            total_questions: form.total_questions,
            created_by: user?.id,
          })
          .select()
          .single();

        if (quizError) throw quizError;

        // Insert questions
        const questionsToInsert = questionsForm.map((q, idx) => ({
          quiz_id: quizData.id,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          hint: q.hint || null,
          order_index: idx,
        }));

        const { error: questionsError } = await supabase.from('quiz_questions').insert(questionsToInsert);
        if (questionsError) throw questionsError;

        toast.success('Quiz created successfully');
      }

      setDialogOpen(false);
      setEditingId(null);
      resetForm();
      fetchQuizzes();
    } catch (error) {
      toast.error('Failed to save quiz');
    }

    setSaving(false);
  };

  const handleEdit = async (quiz: Quiz) => {
    setEditingId(quiz.id);
    setForm({
      title: quiz.title,
      description: quiz.description || '',
      difficulty: quiz.difficulty,
      timer_per_question: quiz.timer_per_question,
      total_questions: quiz.total_questions,
    });

    // Fetch existing questions
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('order_index');

    if (data && data.length > 0) {
      setQuestionsForm(data.map(q => ({
        question: q.question,
        options: q.options as string[],
        hint: q.hint || '',
        correct_answer: q.correct_answer,
      })));
      setStep('questions');
    } else {
      // Initialize empty forms
      const forms: QuestionFormData[] = Array.from({ length: quiz.total_questions }, () => ({
        question: '',
        options: ['', '', '', ''],
        hint: '',
        correct_answer: 0,
      }));
      setQuestionsForm(forms);
      setStep('questions');
    }

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
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Quiz' : 'New Quiz'} 
                {step === 'questions' && ` - Questions (${questionsForm.length})`}
              </DialogTitle>
            </DialogHeader>

            {step === 'details' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title</Label>
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
                      max={50}
                      value={form.total_questions}
                      onChange={(e) => setForm({ ...form, total_questions: parseInt(e.target.value) || 5 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Timer per Question</Label>
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

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (!form.title.trim()) {
                        toast.error('Please enter a title');
                        return;
                      }
                      initializeQuestionForms();
                    }}
                  >
                    Next: Add Questions
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-6">
                    {questionsForm.map((q, idx) => (
                      <Card key={idx} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Question {idx + 1}</Label>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimer(form.timer_per_question)}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <Textarea
                              value={q.question}
                              onChange={(e) => updateQuestionForm(idx, 'question', e.target.value)}
                              placeholder="Enter your question"
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Options (select correct answer)</Label>
                            <div className="grid gap-2">
                              {q.options.map((option, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct-${idx}`}
                                    checked={q.correct_answer === optIdx}
                                    onChange={() => updateQuestionForm(idx, 'correct_answer', optIdx)}
                                    className="w-4 h-4 accent-primary"
                                  />
                                  <Input
                                    value={option}
                                    onChange={(e) => updateQuestionOption(idx, optIdx, e.target.value)}
                                    placeholder={`Option ${optIdx + 1}`}
                                    className={q.correct_answer === optIdx ? 'border-green-500 bg-green-500/5' : ''}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground flex items-center gap-1">
                              <HelpCircle className="w-3.5 h-3.5" />
                              Hint (optional)
                            </Label>
                            <Input
                              value={q.hint}
                              onChange={(e) => updateQuestionForm(idx, 'hint', e.target.value)}
                              placeholder="A helpful hint for students"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex justify-between gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setStep('details')}>
                    Back to Details
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingId ? 'Update Quiz' : 'Create Quiz'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

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
