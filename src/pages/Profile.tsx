import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, User, Loader2 } from 'lucide-react';
import roboClubLogo from '@/assets/roboclub-logo.png';
export default function Profile() {
  const {
    user,
    profile
  } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    enrollment_id: '',
    batch_number: '',
    mobile_number: '',
    bio: ''
  });
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        enrollment_id: profile.enrollment_id || '',
        batch_number: profile.batch_number || '',
        mobile_number: profile.mobile_number || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const {
        error
      } = await supabase.from('profiles').update({
        full_name: formData.full_name.trim(),
        enrollment_id: formData.enrollment_id.trim(),
        batch_number: formData.batch_number.trim(),
        mobile_number: formData.mobile_number.trim() || null,
        bio: formData.bio.trim() || null
      }).eq('user_id', user.id);
      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src={roboClubLogo} alt="RoboClub Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-display font-bold text-accent">त्रिnetraCore</span>
          </div>

          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input id="full_name" type="text" value={formData.full_name} onChange={e => setFormData({
                ...formData,
                full_name: e.target.value
              })} placeholder="Enter your full name" required />
              </div>

              {/* Enrollment ID */}
              <div className="space-y-2">
                <Label htmlFor="enrollment_id">Enrollment ID *</Label>
                <Input id="enrollment_id" type="text" value={formData.enrollment_id} onChange={e => setFormData({
                ...formData,
                enrollment_id: e.target.value
              })} placeholder="Enter your enrollment ID" required />
              </div>

              {/* Batch Number */}
              <div className="space-y-2">
                <Label htmlFor="batch_number">Batch *</Label>
                <Input id="batch_number" type="text" value={formData.batch_number} onChange={e => setFormData({
                ...formData,
                batch_number: e.target.value
              })} placeholder="Enter your batch number" required />
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <Input id="mobile_number" type="tel" value={formData.mobile_number} onChange={e => setFormData({
                ...formData,
                mobile_number: e.target.value
              })} placeholder="Enter your mobile number" />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={formData.bio} onChange={e => setFormData({
                ...formData,
                bio: e.target.value
              })} placeholder="Tell us a bit about yourself..." rows={4} />
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </> : <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>;
}