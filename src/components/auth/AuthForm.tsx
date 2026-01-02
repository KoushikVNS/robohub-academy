import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Mail, Bot, KeyRound } from 'lucide-react';

const emailSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').max(255),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type EmailFormData = z.infer<typeof emailSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

interface AuthFormProps {
  mode: 'login' | 'signup';
  onToggleMode: () => void;
  onSuccess: () => void;
}

export function AuthForm({ mode, onToggleMode, onSuccess }: AuthFormProps) {
  const { signInWithOtp, verifyOtp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const handleSendOtp = async (data: EmailFormData) => {
    setLoading(true);
    try {
      const { error } = await signInWithOtp(data.email);

      if (error) {
        toast.error(error.message);
        return;
      }

      setEmail(data.email);
      setOtpSent(true);
      toast.success('OTP sent to your email! Check your inbox.');
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (data: OtpFormData) => {
    setLoading(true);
    try {
      const { error } = await verifyOtp(email, data.otp);

      if (error) {
        toast.error('Invalid OTP. Please try again.');
        return;
      }

      toast.success('Welcome!');
      onSuccess();
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithOtp(email);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('New OTP sent to your email!');
    } catch (err) {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 glow">
          <Bot className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          {otpSent ? 'Enter OTP' : (mode === 'login' ? 'Welcome Back' : 'Join the Club')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {otpSent 
            ? `We sent a 6-digit code to ${email}` 
            : (mode === 'login' 
              ? 'Sign in with your email' 
              : 'Create your account to get started')}
        </p>
      </div>

      <div className="space-y-6">
        {!otpSent ? (
          /* Email Form */
          <form onSubmit={emailForm.handleSubmit(handleSendOtp)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 h-12"
                  {...emailForm.register('email')}
                />
              </div>
              {emailForm.formState.errors.email && (
                <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
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
              Send OTP
            </Button>
          </form>
        ) : (
          /* OTP Form */
          <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter 6-digit OTP</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  className="pl-10 h-12 text-center text-lg tracking-widest"
                  {...otpForm.register('otp')}
                />
              </div>
              {otpForm.formState.errors.otp && (
                <p className="text-sm text-destructive">{otpForm.formState.errors.otp.message}</p>
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
              Verify & Continue
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setEmail('');
                  otpForm.reset();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Change email
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-primary font-medium hover:underline"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {!otpSent && (
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-primary font-medium hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
