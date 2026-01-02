import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { ProfileForm } from '@/components/auth/ProfileForm';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Bot, Cog, Cpu, Zap } from 'lucide-react';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { user, hasProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && hasProfile) {
      navigate('/');
    }
  }, [user, hasProfile, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const showProfileForm = user && !hasProfile;

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-32 h-32 border border-primary/30 rounded-full animate-pulse-glow" />
          <div className="absolute top-40 right-40 w-24 h-24 border border-secondary/30 rounded-lg rotate-45 animate-float" />
          <div className="absolute bottom-40 left-40 w-20 h-20 border border-accent/30 rounded-full" />
          <div className="absolute bottom-20 right-20 w-28 h-28 border border-primary/20 rounded-lg" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Bot className="w-7 h-7" />
            </div>
            <span className="text-2xl font-display font-bold">RoboClub</span>
          </div>

          <h2 className="text-4xl font-display font-bold mb-4 leading-tight">
            Build. Learn.<br />
            <span className="text-gradient">Innovate.</span>
          </h2>

          <p className="text-lg text-gray-300 mb-8 max-w-md">
            Join our community of makers and engineers. Access tutorials, 
            collaborate on projects, and push the boundaries of robotics.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-primary" />
              </div>
              <span className="text-gray-300">Video tutorials & quizzes</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <Cog className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-gray-300">Lab component requests</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent" />
              </div>
              <span className="text-gray-300">XP points & leaderboard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-display font-bold">RoboClub</span>
          </div>

          {showProfileForm ? (
            <ProfileForm onSuccess={() => navigate('/')} />
          ) : (
            <AuthForm
              mode={mode}
              onToggleMode={() => setMode(mode === 'login' ? 'signup' : 'login')}
              onSuccess={() => {
                if (!hasProfile) {
                  // Will trigger re-render and show profile form
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
