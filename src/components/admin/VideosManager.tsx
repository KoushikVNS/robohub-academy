import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Edit, Upload, Video } from 'lucide-react';
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
  created_at: string;
}

export function VideosManager() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', video_url: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      toast.error('Video file must be less than 100MB');
      return;
    }

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('videos')
      .upload(fileName, file);

    if (error) {
      toast.error('Failed to upload video');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName);

    setForm({ ...form, video_url: urlData.publicUrl });
    toast.success('Video uploaded');
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.video_url.trim()) {
      toast.error('Please fill in title and upload a video');
      return;
    }

    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from('videos')
        .update({ 
          title: form.title, 
          description: form.description || null,
          video_url: form.video_url,
        })
        .eq('id', editingId);

      if (error) {
        toast.error('Failed to update video');
      } else {
        toast.success('Video updated');
        setDialogOpen(false);
        setEditingId(null);
        setForm({ title: '', description: '', video_url: '' });
        fetchVideos();
      }
    } else {
      const { error } = await supabase
        .from('videos')
        .insert({ 
          title: form.title, 
          description: form.description || null,
          video_url: form.video_url,
          created_by: user?.id,
        });

      if (error) {
        toast.error('Failed to add video');
      } else {
        toast.success('Video added');
        setDialogOpen(false);
        setForm({ title: '', description: '', video_url: '' });
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
    });
    setDialogOpen(true);
  };

  const handleDelete = async (video: VideoItem) => {
    // Extract filename from URL to delete from storage
    const fileName = video.video_url.split('/').pop();
    if (fileName) {
      await supabase.storage.from('videos').remove([fileName]);
    }

    const { error } = await supabase.from('videos').delete().eq('id', video.id);
    if (error) {
      toast.error('Failed to delete video');
    } else {
      toast.success('Video deleted');
      fetchVideos();
    }
  };

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
            setForm({ title: '', description: '', video_url: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Video' : 'Upload Video'}</DialogTitle>
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
                <Label>Video File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {form.video_url ? (
                  <div className="space-y-2">
                    <video
                      src={form.video_url}
                      controls
                      className="w-full rounded-lg max-h-48"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Replace Video
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-24 border-dashed"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mr-2" />
                        Click to upload video
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || uploading}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? 'Update' : 'Add Video'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <Card key={video.id}>
            <CardHeader className="p-0">
              <video
                src={video.video_url}
                controls
                className="w-full aspect-video rounded-t-lg"
              />
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{video.title}</CardTitle>
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
        ))}
        {videos.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No videos uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
