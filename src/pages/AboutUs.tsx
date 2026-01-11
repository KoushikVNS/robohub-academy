import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Linkedin } from 'lucide-react';
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
  linkedin: string;
  isPresident?: boolean;
}

// Team members array - President (Kaushik) is at index 3 (center)
const teamMembers: TeamMember[] = [{
  id: 1,
  name: 'Sayan Das',
  role: 'Course Designer',
  image: sayanImg,
  linkedin: 'https://www.linkedin.com/in/sayan-das-88b25b349'
}, {
  id: 2,
  name: 'Rupika Gupta',
  role: 'Content Creation',
  image: rupikaImg,
  linkedin: 'https://www.linkedin.com/in/rupika-gupta-057538317'
}, {
  id: 3,
  name: 'Ritesh Yadav',
  role: 'Content Creation',
  image: riteshImg,
  linkedin: 'https://www.linkedin.com/in/ritesh-yadav-b1863a211'
}, {
  id: 4,
  name: 'Kaushik Chakraborty',
  role: 'President & Mentor',
  image: kaushikImg,
  linkedin: 'https://www.linkedin.com/in/kaushik-chakraborty-vns/',
  isPresident: true
}, {
  id: 5,
  name: 'Piyush Kumar',
  role: 'Content Creation',
  image: piyushImg,
  linkedin: 'https://www.linkedin.com/in/piyush-kumar-bharti-4a2a85268'
}, {
  id: 6,
  name: 'Soham Patel',
  role: 'Content Creation',
  image: sohamImg,
  linkedin: 'https://www.linkedin.com/in/soham-patel-3bb32b381'
}, {
  id: 7,
  name: 'Pranjal Singh',
  role: 'Design Lead',
  image: pranjalImg,
  linkedin: 'https://www.linkedin.com/in/pranjal-singh-0b3799315'
}];
export default function AboutUs() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(3); // Start with President in center
  const [isScrolling, setIsScrolling] = useState(false);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(0);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);

  const handleCardClick = (index: number) => {
    if (index === activeIndex) {
      // Toggle flip on active card
      setFlippedCard(flippedCard === index ? null : index);
    } else {
      // Navigate to card and reset flip
      setFlippedCard(null);
      setActiveIndex(index);
    }
  };

  const navigateCards = useCallback((direction: 'next' | 'prev') => {
    const now = Date.now();
    if (now - lastScrollTime.current < 400) return;
    lastScrollTime.current = now;
    setIsScrolling(true);
    
    if (direction === 'next') {
      setActiveIndex(prev => prev < teamMembers.length - 1 ? prev + 1 : prev);
    } else {
      setActiveIndex(prev => prev > 0 ? prev - 1 : prev);
    }
    setTimeout(() => setIsScrolling(false), 400);
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      navigateCards('next');
    } else if (e.deltaY < 0) {
      navigateCards('prev');
    }
  }, [navigateCards]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const diffY = touchStartY.current - touchEndY;
    const diffX = touchStartX.current - touchEndX;
    
    // Check if horizontal swipe is more significant (for mobile)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        navigateCards('next'); // Swipe left = next
      } else {
        navigateCards('prev'); // Swipe right = prev
      }
    } else if (Math.abs(diffY) > 50) {
      // Vertical swipe
      if (diffY > 0) {
        navigateCards('next'); // Swipe up = next
      } else {
        navigateCards('prev'); // Swipe down = prev
      }
    }
  }, [navigateCards]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleWheel, handleTouchStart, handleTouchEnd]);
  const getCardStyle = (index: number, isMobile: boolean) => {
    const diff = index - activeIndex;
    const absDiff = Math.abs(diff);

    // Mobile-optimized spacing
    const spacing = isMobile ? 100 : 180;
    let translateX = diff * spacing;
    let scale = 1;
    let opacity = 1;
    let blur = 0;
    let zIndex = 10 - absDiff;

    if (absDiff === 0) {
      scale = isMobile ? 1.05 : 1.15;
      opacity = 1;
      blur = 0;
      zIndex = 20;
    } else if (absDiff === 1) {
      scale = isMobile ? 0.75 : 0.85;
      opacity = isMobile ? 0.5 : 0.7;
      blur = isMobile ? 3 : 2;
    } else if (absDiff === 2) {
      scale = isMobile ? 0.6 : 0.7;
      opacity = isMobile ? 0.3 : 0.5;
      blur = isMobile ? 5 : 4;
    } else {
      scale = isMobile ? 0.5 : 0.55;
      opacity = isMobile ? 0.2 : 0.3;
      blur = isMobile ? 6 : 6;
    }

    return {
      transform: `translateX(${translateX}px) scale(${scale})`,
      opacity,
      filter: `blur(${blur}px)`,
      zIndex,
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  return <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden touch-none">
      {/* Header */}
      <header className="border-b border-border/20 bg-black/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </Button>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden">
              <img src={roboClubLogo} alt="RoboClub Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg sm:text-xl font-display font-bold text-white">About Us</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 text-white/70">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Our Team</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] px-2 sm:px-4">
        {/* Title */}
        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-2 sm:mb-4">
            Meet Our Team
          </h1>
          <p className="text-white/60 text-sm sm:text-lg">
            {isMobile ? 'Swipe to explore' : 'Scroll to explore our amazing team members'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 sm:mt-4">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/30 animate-pulse" />
            <span className="text-white/40 text-xs sm:text-sm">
              {isMobile ? 'Swipe left or right' : 'Scroll up or down to navigate'}
            </span>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/30 animate-pulse" />
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative w-full flex items-center justify-center h-[320px] sm:h-[400px] md:h-[500px]">
          {/* Cards Container */}
          <div className="relative flex items-center justify-center">
            {teamMembers.map((member, index) => (
              <div 
                key={member.id} 
                className="absolute flex flex-col items-center cursor-pointer" 
                style={getCardStyle(index, isMobile)} 
                onClick={() => handleCardClick(index)}
              >
                {/* Flip Card Container */}
                <div 
                  className={`
                    relative w-36 h-52 sm:w-48 sm:h-72 md:w-56 md:h-80
                    transition-all duration-500
                    ${index === activeIndex ? '[transform-style:preserve-3d]' : ''}
                  `}
                  style={{
                    transform: flippedCard === index ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Front of Card */}
                  <div 
                    className={`
                      absolute inset-0 w-full h-full rounded-xl sm:rounded-2xl overflow-hidden
                      shadow-2xl [backface-visibility:hidden]
                      ${index === activeIndex ? 'ring-2 sm:ring-4 ring-primary/50' : ''}
                      ${member.isPresident && index === activeIndex ? 'ring-primary ring-2 sm:ring-4' : ''}
                    `}
                  >
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover object-top" />
                    
                    {/* President badge */}
                    {member.isPresident && index === activeIndex && (
                      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-primary text-primary-foreground px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold animate-pulse">
                        President
                      </div>
                    )}
                    
                    {/* Click hint for active card */}
                    {index === activeIndex && flippedCard !== index && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white/80 px-2 py-1 rounded-full text-[10px] sm:text-xs backdrop-blur-sm">
                        Tap to flip
                      </div>
                    )}
                  </div>

                  {/* Back of Card */}
                  <div 
                    className={`
                      absolute inset-0 w-full h-full rounded-xl sm:rounded-2xl overflow-hidden
                      shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]
                      bg-gradient-to-br from-gray-800 via-gray-900 to-black
                      flex flex-col items-center justify-center p-4
                      ${index === activeIndex ? 'ring-2 sm:ring-4 ring-primary/50' : ''}
                    `}
                  >
                    <h3 className="text-sm sm:text-lg font-display font-bold text-white mb-2 text-center">
                      Contact Me
                    </h3>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden mb-3 ring-2 ring-primary/30">
                      <img src={member.image} alt={member.name} className="w-full h-full object-cover object-top" />
                    </div>
                    <p className="text-white/80 text-xs sm:text-sm font-medium mb-3 text-center">
                      {member.name}
                    </p>
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium"
                    >
                      <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                      LinkedIn
                    </a>
                    <p className="text-white/40 text-[10px] sm:text-xs mt-3">
                      Tap to flip back
                    </p>
                  </div>
                </div>

                {/* Name & Role (only visible for active card) */}
                <div className={`
                    mt-2 sm:mt-4 text-center transition-all duration-500
                    ${index === activeIndex && flippedCard !== index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                  `}>
                  <h3 className="text-base sm:text-xl font-display font-bold text-white">
                    {member.name}
                  </h3>
                  <p className="text-white/60 text-xs sm:text-sm mt-0.5 sm:mt-1">
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Position Indicators */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-4 sm:mt-8">
          {teamMembers.map((_, index) => <button key={index} onClick={() => setActiveIndex(index)} className={`
                w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300
                ${index === activeIndex ? 'w-6 sm:w-8 bg-primary' : 'bg-white/30 hover:bg-white/50'}
              `} aria-label={`Go to team member ${index + 1}`} />)}
        </div>

        {/* Current Position Label */}
        <div className="mt-2 sm:mt-4 text-white/40 text-xs sm:text-sm">
          {activeIndex + 1} / {teamMembers.length}
        </div>
      </main>
    </div>;
}