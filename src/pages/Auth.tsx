import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Cpu, Cog, Zap } from 'lucide-react';
import mascotVideo from '@/assets/mascot-video.mp4';
import roboClubLogo from '@/assets/roboclub-logo.png';
export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>;
  }
  return <div className="min-h-screen flex relative overflow-hidden">
      {/* Galaxy Background */}
      <div className="absolute inset-0 bg-[#0a0a1a]">
        {/* Animated stars */}
        <div className="absolute inset-0">
          {[...Array(100)].map((_, i) => <div key={i} className="absolute rounded-full bg-white animate-pulse" style={{
          width: Math.random() * 3 + 1 + 'px',
          height: Math.random() * 3 + 1 + 'px',
          top: Math.random() * 100 + '%',
          left: Math.random() * 100 + '%',
          animationDelay: Math.random() * 3 + 's',
          animationDuration: Math.random() * 2 + 2 + 's',
          opacity: Math.random() * 0.7 + 0.3
        }} />)}
        </div>
        
        {/* Nebula gradients */}
        <div className="absolute top-0 left-0 w-full h-full opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/30 rounded-full blur-[100px] animate-pulse" style={{
          animationDelay: '1s'
        }} />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-600/20 rounded-full blur-[80px] animate-pulse" style={{
          animationDelay: '2s'
        }} />
          <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-indigo-600/25 rounded-full blur-[90px] animate-pulse" style={{
          animationDelay: '0.5s'
        }} />
        </div>
        
        {/* Shooting stars */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-1 h-20 bg-gradient-to-b from-white to-transparent rotate-45 animate-shooting-star" style={{
          top: '10%',
          left: '20%',
          animationDelay: '0s'
        }} />
          <div className="absolute w-1 h-16 bg-gradient-to-b from-white to-transparent rotate-45 animate-shooting-star" style={{
          top: '30%',
          left: '60%',
          animationDelay: '3s'
        }} />
          <div className="absolute w-1 h-24 bg-gradient-to-b from-white to-transparent rotate-45 animate-shooting-star" style={{
          top: '50%',
          left: '80%',
          animationDelay: '6s'
        }} />
        </div>
      </div>

      {/* Left side - Video & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white">
          {/* Club Logo */}
          <img src={roboClubLogo} alt="RoboClub Logo" className="w-32 h-32 object-contain mb-6 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]" />
          
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-[#9c0d81]/[0.19] font-serif text-center">Robotics Club </span>
          </div>

          {/* Mascot Video */}
          <div className="relative mb-8 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.4)] border border-purple-500/30">
            <video autoPlay loop muted playsInline className="w-80 h-80 object-cover">
              <source src={mascotVideo} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 via-transparent to-transparent pointer-events-none" />
          </div>

          <h2 className="text-3xl font-display font-bold mb-4 leading-tight text-center">
            Build. Learn.{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Innovate.
            </span>
          </h2>

          <p className="text-lg text-gray-300 mb-8 max-w-md text-center">
            Join our community of makers and engineers. Access tutorials, 
            collaborate on projects, and push the boundaries of robotics.
          </p>

          <div className="flex gap-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center backdrop-blur-sm">
                <Cpu className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-sm text-gray-400">Tutorials</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center backdrop-blur-sm">
                <Cog className="w-6 h-6 text-pink-400" />
              </div>
              <span className="text-sm text-gray-400">Lab Access</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center backdrop-blur-sm">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm text-gray-400">XP Rewards</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center justify-center gap-4 mb-8">
            <img src={roboClubLogo} alt="RoboClub Logo" className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
            <span className="text-2xl font-display font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              RoboClub
            </span>
          </div>

          {/* Auth Form Card */}
          <div className="bg-[#12122a]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 shadow-[0_0_60px_rgba(168,85,247,0.15)]">
            <AuthForm mode={mode} onToggleMode={() => setMode(mode === 'login' ? 'signup' : 'login')} onSuccess={() => navigate('/')} />
          </div>
        </div>
      </div>
    </div>;
}