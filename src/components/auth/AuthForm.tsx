import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Mail, Bot, Lock, User, IdCard, Phone, Hash } from 'lucide-react';

const signupSchema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  enrollment_id: z.string().trim().min(1, 'Enrollment ID is required').max(50),
  batch_number: z.string().trim().min(1, 'Batch number is required').max(20),
  mobile_number: z.string().trim().min(10, 'Enter a valid mobile number').max(15),
  email: z.string().trim().email('Please enter a valid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormData = z.infer<typeof signupSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

interface AuthFormProps {
  mode: 'login' | 'signup';
  onToggleMode: () => void;
  onSuccess: () => void;
}

export function AuthForm({ mode, onToggleMode, onSuccess }: AuthFormProps) {
  const { signUp, signInWithPassword } = useAuth();
  const [loading, setLoading] = useState(false);

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleSignup = async (data: SignupFormData) => {
    setLoading(true);
    try {
      const { error } = await signUp({
        full_name: data.full_name,
        enrollment_id: data.enrollment_id,
        batch_number: data.batch_number,
        mobile_number: data.mobile_number,
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Account created successfully! You can now sign in.');
      signupForm.reset();
      loginForm.setValue('email', data.email);
      onToggleMode();
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const { error } = await signInWithPassword(data.email, data.password);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Welcome back!');
      onSuccess();
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Login form
  if (mode === 'login') {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 glow">
            <Bot className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mt-2">
            Sign in with your email and password
          </p>
        </div>

        <div className="space-y-6">
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 h-12"
                  {...loginForm.register('email')}
                />
              </div>
              {loginForm.formState.errors.email && (
                <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12"
                  {...loginForm.register('password')}
                />
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium gradient-primary hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : null}
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Signup form
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 glow">
          <Bot className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Join the Club
        </h1>
        <p className="text-muted-foreground mt-2">
          Create your account to get started
        </p>
      </div>

      <div className="space-y-6">
        <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="full_name"
                type="text"
                placeholder="John Doe"
                className="pl-10 h-12"
                {...signupForm.register('full_name')}
              />
            </div>
            {signupForm.formState.errors.full_name && (
              <p className="text-sm text-destructive">{signupForm.formState.errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="enrollment_id">Enrollment ID</Label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="enrollment_id"
                type="text"
                placeholder="ENR123456"
                className="pl-10 h-12"
                {...signupForm.register('enrollment_id')}
              />
            </div>
            {signupForm.formState.errors.enrollment_id && (
              <p className="text-sm text-destructive">{signupForm.formState.errors.enrollment_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch_number">Batch Number</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="batch_number"
                type="text"
                placeholder="2024-A"
                className="pl-10 h-12"
                {...signupForm.register('batch_number')}
              />
            </div>
            {signupForm.formState.errors.batch_number && (
              <p className="text-sm text-destructive">{signupForm.formState.errors.batch_number.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile_number">Mobile Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="mobile_number"
                type="tel"
                placeholder="9876543210"
                className="pl-10 h-12"
                {...signupForm.register('mobile_number')}
              />
            </div>
            {signupForm.formState.errors.mobile_number && (
              <p className="text-sm text-destructive">{signupForm.formState.errors.mobile_number.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                className="pl-10 h-12"
                {...signupForm.register('email')}
              />
            </div>
            {signupForm.formState.errors.email && (
              <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="signup-password"
                type="password"
                placeholder="••••••••"
                className="pl-10 h-12"
                {...signupForm.register('password')}
              />
            </div>
            {signupForm.formState.errors.password && (
              <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="pl-10 h-12"
                {...signupForm.register('confirmPassword')}
              />
            </div>
            {signupForm.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium gradient-primary hover:opacity-90 transition-opacity"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : null}
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
