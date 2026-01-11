import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import roboClubLogo from '@/assets/roboclub-logo.png';

// Import team images
import kaushikImg from '@/assets/team/kaushik-chakraborty.png';
import piyushImg from '@/assets/team/piyush-kumar.png';
import riteshImg from '@/assets/team/ritesh-yadav.png';
import rupikaImg from '@/assets/team/rupika-gupta.png';
import sayanImg from '@/assets/team/sayan-das.png';
import sohamImg from '@/assets/team/soham-patel.png';
import pranjalImg from '@/assets/team/pranjal-singh.jpeg';
interface TeamMember {
  id: number;
  name: string;
  role: string;
  image: string;
  isPresident?: boolean;
}

// Team members array - President (Kaushik) is at index 3 (center)
const teamMembers: TeamMember[] = [{
  id: 1,
  name: 'Sayan Das',
  role: 'Course Designer',
  image: sayanImg
}, {
  id: 2,
  name: 'Rupika Gupta',
  role: 'Content Creation',
  image: rupikaImg
}, {
  id: 3,
  name: 'Ritesh Yadav',
  role: 'Content Creation',
  image: riteshImg
}, {
  id: 4,
  name: 'Kaushik Chakraborty',
  role: 'President & Mentor',
  image: kaushikImg,
  isPresident: true
}, {
  id: 5,
  name: 'Piyush Kumar',
  role: 'Content Creation',
  image: piyushImg
}, {
  id: 6,
  name: 'Soham Patel',
  role: 'Content Creation',
  image: sohamImg
}, {
  id: 7,
  name: 'Pranjal Singh',
  role: 'Design Lead',
  image: pranjalImg
}
];
export default function AboutUs() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(3); // Start with President in center
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(0);
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const now = Date.now();
    // Throttle scroll events for smoother experience
    if (now - lastScrollTime.current < 500) return;
    lastScrollTime.current = now;
    setIsScrolling(true);
    if (e.deltaY > 0) {
      // Scroll down - move to next (right side comes to center)
      setActiveIndex(prev => prev < teamMembers.length - 1 ? prev + 1 : prev);
    } else if (e.deltaY < 0) {
      // Scroll up - move to previous (left side comes to center)
      setActiveIndex(prev => prev > 0 ? prev - 1 : prev);
    }
    setTimeout(() => setIsScrolling(false), 500);
  }, []);
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, {
        passive: false
      });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [handleWheel]);
  const getCardStyle = (index: number) => {
    const diff = index - activeIndex;
    const absDiff = Math.abs(diff);

    // Base values
    let translateX = diff * 180; // Spacing between cards
    let scale = 1;
    let opacity = 1;
    let blur = 0;
    let zIndex = 10 - absDiff;
    if (absDiff === 0) {
      // Center (active) card
      scale = 1.15;
      opacity = 1;
      blur = 0;
      zIndex = 20;
    } else if (absDiff === 1) {
      scale = 0.85;
      opacity = 0.7;
      blur = 2;
    } else if (absDiff === 2) {
      scale = 0.7;
      opacity = 0.5;
      blur = 4;
    } else {
      scale = 0.55;
      opacity = 0.3;
      blur = 6;
    }
    return {
      transform: `translateX(${translateX}px) scale(${scale})`,
      opacity,
      filter: `blur(${blur}px)`,
      zIndex,
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  };
  return <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/20 bg-black/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src={roboClubLogo} alt="RoboClub Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-display font-bold text-white">About Us</span>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <Users className="w-5 h-5" />
            <span className="text-sm">Our Team</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Meet Our Team
          </h1>
          <p className="text-white/60 text-lg">
            Scroll to explore our amazing team members
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-white/30 animate-pulse" />
            <span className="text-white/40 text-sm">Scroll up or down to navigate</span>
            <div className="w-2 h-2 rounded-full bg-white/30 animate-pulse" />
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative w-full flex items-center justify-center h-[500px]">
          {/* Cards Container */}
          <div className="relative flex items-center justify-center">
            {teamMembers.map((member, index) => <div key={member.id} className="absolute flex flex-col items-center cursor-pointer" style={getCardStyle(index)}>
                {/* Card */}
                <div className={`
                    relative w-48 h-72 md:w-56 md:h-80 rounded-2xl overflow-hidden
                    shadow-2xl transition-all duration-500
                    ${index === activeIndex ? 'ring-4 ring-primary/50' : ''}
                    ${member.isPresident && index === activeIndex ? 'ring-primary ring-4' : ''}
                  `}>
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover object-top" />
                  
                  {/* Overlay gradient */}
                  
                  
                  {/* President badge */}
                  {member.isPresident && index === activeIndex && <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                      President
                    </div>}
                </div>

                {/* Name & Role (only visible for active card) */}
                <div className={`
                    mt-4 text-center transition-all duration-500
                    ${index === activeIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                  `}>
                  <h3 className="text-xl font-display font-bold text-white">
                    {member.name}
                  </h3>
                  <p className="text-white/60 text-sm mt-1">
                    {member.role}
                  </p>
                </div>
              </div>)}
          </div>
        </div>

        {/* Position Indicators */}
        <div className="flex items-center gap-2 mt-8">
          {teamMembers.map((_, index) => <button key={index} onClick={() => setActiveIndex(index)} className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${index === activeIndex ? 'w-8 bg-primary' : 'bg-white/30 hover:bg-white/50'}
              `} aria-label={`Go to team member ${index + 1}`} />)}
        </div>

        {/* Current Position Label */}
        <div className="mt-4 text-white/40 text-sm">
          {activeIndex + 1} / {teamMembers.length}
        </div>
      </main>
    </div>;
}