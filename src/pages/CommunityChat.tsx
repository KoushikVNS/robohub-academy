import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft,
  MessageSquare,
  Send,
  Users
} from 'lucide-react';
import roboClubLogo from '@/assets/roboclub-logo.png';

export default function CommunityChat() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src={roboClubLogo} alt="RoboClub Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-display font-bold">Community Chat</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-border/50 h-[calc(100vh-12rem)]">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    General Chat
                  </CardTitle>
                  <CardDescription>Connect with fellow robotics enthusiasts</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Members online</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-5rem)] p-0">
              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                  <h3 className="text-lg font-semibold mb-2">Community Chat Coming Soon!</h3>
                  <p className="max-w-md">
                    We're working on bringing you a real-time chat experience. 
                    Stay tuned for updates!
                  </p>
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border/50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled
                    className="flex-1"
                  />
                  <Button disabled>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Chat functionality is coming soon!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
