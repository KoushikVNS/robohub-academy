import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  MessageSquare,
  Send,
  Users,
  Trash2
} from 'lucide-react';
import roboClubLogo from '@/assets/roboclub-logo.png';
import { useChatMessages } from '@/hooks/useChatMessages';
import { format } from 'date-fns';

export default function CommunityChat() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const { messages, isLoading, sendMessage, deleteMessage } = useChatMessages();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    await sendMessage(message);
    setMessage('');
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Please log in to access the community chat.</p>
          <Button onClick={() => navigate('/auth')}>Log In</Button>
        </Card>
      </div>
    );
  }

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

      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-border/50 h-[calc(100vh-8rem)] sm:h-[calc(100vh-12rem)]">
            <CardHeader className="border-b border-border/50 py-3 sm:py-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    General Chat
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Connect with fellow robotics enthusiasts</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Members</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-4rem)] sm:h-[calc(100%-5rem)] p-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollRef}>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-12 w-48" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 mb-4 opacity-30" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">No messages yet</h3>
                    <p className="max-w-md text-sm">
                      Be the first to start a conversation!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwnMessage = msg.user_id === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2 sm:gap-3 group ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                        >
                          <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                            <AvatarImage src={msg.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(msg.profile?.full_name || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[75%] sm:max-w-[70%] ${isOwnMessage ? 'text-right' : ''}`}>
                            <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                              <span className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                                {msg.profile?.full_name || 'Unknown User'}
                              </span>
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                {format(new Date(msg.created_at), 'HH:mm')}
                              </span>
                              {isOwnMessage && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-5 h-5 sm:w-6 sm:h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => deleteMessage(msg.id)}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                            <div
                              className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-2 text-sm ${
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-3 sm:p-4 border-t border-border/50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isSending}
                    className="flex-1 text-sm sm:text-base"
                  />
                  <Button 
                    onClick={handleSend} 
                    disabled={!message.trim() || isSending}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
