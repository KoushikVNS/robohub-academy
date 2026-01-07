import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Edit, Video, Link, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  xp_reward: number;
  created_at: string;
}

// Extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Get YouTube thumbnail from video ID
const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

export function VideosManager() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', video_url: '', xp_reward: 5 });
  const [saving, setSaving] = useState(false);

  const fetchVideos = async () => {
    const { data } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setVideos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.video_url.trim()) {
      toast.error('Please fill in title and video URL');
      return;
    }

    const videoId = getYouTubeVideoId(form.video_url);
    if (!videoId) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    setSaving(true);
    const thumbnailUrl = getYouTubeThumbnail(videoId);

    if (editingId) {
      const { error } = await supabase
        .from('videos')
        .update({ 
          title: form.title, 
          description: form.description || null,
          video_url: form.video_url,
          thumbnail_url: thumbnailUrl,
          xp_reward: form.xp_reward,
        })
        .eq('id', editingId);

      if (error) {
        toast.error('Failed to update video');
      } else {
        toast.success('Video updated');
        setDialogOpen(false);
        setEditingId(null);
        setForm({ title: '', description: '', video_url: '', xp_reward: 5 });
        fetchVideos();
      }
    } else {
      const { error } = await supabase
        .from('videos')
        .insert({ 
          title: form.title, 
          description: form.description || null,
          video_url: form.video_url,
          thumbnail_url: thumbnailUrl,
          xp_reward: form.xp_reward,
          created_by: user?.id,
        });

      if (error) {
        toast.error('Failed to add video');
      } else {
        toast.success('Video added');
        setDialogOpen(false);
        setForm({ title: '', description: '', video_url: '', xp_reward: 5 });
        fetchVideos();
      }
    }
    setSaving(false);
  };

  const handleEdit = (video: VideoItem) => {
    setEditingId(video.id);
    setForm({ 
      title: video.title, 
      description: video.description || '',
      video_url: video.video_url,
      xp_reward: video.xp_reward,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (video: VideoItem) => {
    const { error } = await supabase.from('videos').delete().eq('id', video.id);
    if (error) {
      toast.error('Failed to delete video');
    } else {
      toast.success('Video deleted');
      fetchVideos();
    }
  };

  const videoId = getYouTubeVideoId(form.video_url);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{videos.length} Videos</h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setForm({ title: '', description: '', video_url: '', xp_reward: 5 });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Video' : 'Add Video'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Video title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Video description (optional)"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video_url">YouTube URL</Label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="video_url"
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste a YouTube video link (regular, shorts, or embed URL)
                </p>
                {videoId && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-border">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      className="w-full aspect-video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="xp_reward" className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  XP Reward
                </Label>
                <Input
                  id="xp_reward"
                  type="number"
                  min={0}
                  max={100}
                  value={form.xp_reward}
                  onChange={(e) => setForm({ ...form, xp_reward: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  XP earned when student marks video as watched
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !videoId}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? 'Update' : 'Add Video'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => {
          const vId = getYouTubeVideoId(video.video_url);
          return (
            <Card key={video.id}>
              <CardHeader className="p-0">
                {vId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${vId}`}
                    className="w-full aspect-video rounded-t-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full aspect-video bg-muted flex items-center justify-center rounded-t-lg">
                    <Video className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base truncate">{video.title}</CardTitle>
                      <Badge variant="outline" className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20 shrink-0">
                        <Zap className="w-3 h-3" />
                        +{video.xp_reward}
                      </Badge>
                    </div>
                    {video.description && (
                      <p className="text-sm text-muted-foreground truncate">{video.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(video.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(video)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(video)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {videos.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No videos added yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
