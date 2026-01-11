import { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS, EVENTS } from 'react-joyride';

interface WalkthroughProps {
  run: boolean;
  onComplete: () => void;
}

export function Walkthrough({ run, onComplete }: WalkthroughProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h3 className="text-lg font-bold mb-2">🤖 Welcome to चिंतनCore!</h3>
          <p>Let us give you a quick tour of all the amazing features available to you.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="stats"]',
      content: (
        <div>
          <h3 className="font-bold mb-2">📊 Your Stats</h3>
          <p>Track your progress here! See videos watched, quizzes completed, XP earned, and your rank among members.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="learning-hub"]',
      content: (
        <div>
          <h3 className="font-bold mb-2">📚 Learning Hub</h3>
          <p>Watch tutorials, complete quizzes, and earn XP points to climb the leaderboard!</p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="community-chat"]',
      content: (
        <div>
          <h3 className="font-bold mb-2">💬 Community Chat</h3>
          <p>Connect with fellow robotics enthusiasts, ask questions, and share your projects!</p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="lab-access"]',
      content: (
        <div>
          <h3 className="font-bold mb-2">🔧 Lab Access</h3>
          <p>Request components for your robotics projects. Browse available parts and submit requests!</p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="leaderboard"]',
      content: (
        <div>
          <h3 className="font-bold mb-2">🏆 Leaderboard</h3>
          <p>See how you rank among other members. Earn more XP to climb to the top!</p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="announcements"]',
      content: (
        <div>
          <h3 className="font-bold mb-2">📢 Announcements</h3>
          <p>Stay updated with the latest club news, events, and important updates!</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="profile"]',
      content: (
        <div>
          <h3 className="font-bold mb-2">👤 Your Profile</h3>
          <p>View and edit your profile information here.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h3 className="text-lg font-bold mb-2">🎉 You're All Set!</h3>
          <p>Start exploring and have fun learning robotics! You can always restart this tour from the help button.</p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;
    
    if (type === EVENTS.STEP_AFTER) {
      setStepIndex(index + 1);
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      onComplete();
      setStepIndex(0);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#22c55e',
          backgroundColor: '#1a1a2e',
          textColor: '#ffffff',
          arrowColor: '#1a1a2e',
          overlayColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
        },
        tooltipContent: {
          padding: '10px 0',
        },
        buttonNext: {
          backgroundColor: '#22c55e',
          borderRadius: '8px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#a1a1aa',
          marginRight: '10px',
        },
        buttonSkip: {
          color: '#a1a1aa',
        },
        spotlight: {
          borderRadius: '12px',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
}
