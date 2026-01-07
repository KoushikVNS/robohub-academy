import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Mail, Bot, Lock, User, IdCard, Phone, Hash, ArrowLeft } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

// Step 1: Collect profile info and email
const step1Schema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  enrollment_id: z.string().trim().min(1, 'Enrollment ID is required').max(50),
  batch_number: z.string().trim().min(1, 'Batch number is required').max(20),
  mobile_number: z.string().trim().min(10, 'Enter a valid mobile number').max(15),
  email: z.string().trim().email('Please enter a valid email address').max(255),
});

// Step 2: OTP and password
const step2Schema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
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

type Step1FormData = z.infer<typeof step1Schema>;
type Step2FormData = z.infer<typeof step2Schema>;
type LoginFormData = z.infer<typeof loginSchema>;

interface AuthFormProps {
  mode: 'login' | 'signup';
  onToggleMode: () => void;
  onSuccess: () => void;
}

export function AuthForm({ mode, onToggleMode, onSuccess }: AuthFormProps) {
  const { sendOtp, verifyOtpAndSignUp, signInWithPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [signupStep, setSignupStep] = useState<'form' | 'otp'>('form');
  const [step1Data, setStep1Data] = useState<Step1FormData | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const step1Form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
  });

  const step2Form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Sync OTP value with form
  useEffect(() => {
    step2Form.setValue('otp', otpValue);
  }, [otpValue, step2Form]);

  const handleStep1Submit = async (data: Step1FormData) => {
    setLoading(true);
    try {
      const { error } = await sendOtp(data.email);

      if (error) {
        toast.error(error.message);
        return;
      }

      setStep1Data(data);
      setSignupStep('otp');
      setResendCooldown(60);
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (data: Step2FormData) => {
    if (!step1Data) return;
    
    setLoading(true);
    try {
      const { error } = await verifyOtpAndSignUp({
        full_name: step1Data.full_name,
        enrollment_id: step1Data.enrollment_id,
        batch_number: step1Data.batch_number,
        mobile_number: step1Data.mobile_number,
        email: step1Data.email,
        otp: data.otp,
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Account created successfully! Please sign in.');
      // Reset forms and go to login
      step1Form.reset();
      step2Form.reset();
      setOtpValue('');
      setSignupStep('form');
      setStep1Data(null);
      loginForm.setValue('email', step1Data.email);
      onToggleMode();
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!step1Data || resendCooldown > 0) return;
    
    setLoading(true);
    try {
      const { error } = await sendOtp(step1Data.email);

      if (error) {
        toast.error(error.message);
        return;
      }

      setResendCooldown(60);
      setOtpValue('');
      toast.success('New OTP sent!');
    } catch (err) {
      toast.error('Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setSignupStep('form');
    setOtpValue('');
    step2Form.reset();
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

  const maskedEmail = step1Data?.email 
    ? step1Data.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : '';

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

  // Signup Step 2: OTP Verification
  if (signupStep === 'otp') {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 glow">
            <Mail className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Verify Email
          </h1>
          <p className="text-muted-foreground mt-2">
            Enter the 6-digit code sent to <span className="font-medium text-foreground">{maskedEmail}</span>
          </p>
        </div>

        <div className="space-y-6">
          <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpValue}
                  onChange={setOtpValue}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {step2Form.formState.errors.otp && (
                <p className="text-sm text-destructive text-center">{step2Form.formState.errors.otp.message}</p>
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
                  {...step2Form.register('password')}
                />
              </div>
              {step2Form.formState.errors.password && (
                <p className="text-sm text-destructive">{step2Form.formState.errors.password.message}</p>
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
                  {...step2Form.register('confirmPassword')}
                />
              </div>
              {step2Form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{step2Form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium gradient-primary hover:opacity-90 transition-opacity"
              disabled={loading || otpValue.length !== 6}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : null}
              Create Account
            </Button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleBackToStep1}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || loading}
              className="text-primary font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Signup Step 1: Profile info form
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
          We'll send an OTP to verify your email
        </p>
      </div>

      <div className="space-y-6">
        <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="full_name"
                type="text"
                placeholder="John Doe"
                className="pl-10 h-12"
                {...step1Form.register('full_name')}
              />
            </div>
            {step1Form.formState.errors.full_name && (
              <p className="text-sm text-destructive">{step1Form.formState.errors.full_name.message}</p>
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
                {...step1Form.register('enrollment_id')}
              />
            </div>
            {step1Form.formState.errors.enrollment_id && (
              <p className="text-sm text-destructive">{step1Form.formState.errors.enrollment_id.message}</p>
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
                {...step1Form.register('batch_number')}
              />
            </div>
            {step1Form.formState.errors.batch_number && (
              <p className="text-sm text-destructive">{step1Form.formState.errors.batch_number.message}</p>
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
                {...step1Form.register('mobile_number')}
              />
            </div>
            {step1Form.formState.errors.mobile_number && (
              <p className="text-sm text-destructive">{step1Form.formState.errors.mobile_number.message}</p>
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
                {...step1Form.register('email')}
              />
            </div>
            {step1Form.formState.errors.email && (
              <p className="text-sm text-destructive">{step1Form.formState.errors.email.message}</p>
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
