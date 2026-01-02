import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, User, Hash, Calendar, Sparkles } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  enrollment_id: z.string().trim().min(3, 'Enrollment ID is required').max(50),
  batch_number: z.string().trim().min(1, 'Batch number is required').max(20),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  onSuccess: () => void;
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const { createProfile, user } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      const { error } = await createProfile({
        full_name: data.full_name,
        enrollment_id: data.enrollment_id,
        batch_number: data.batch_number,
      });

      if (error) {
        if (error.message.includes('duplicate key') || error.message.includes('unique')) {
          toast.error('This enrollment ID is already registered.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Profile created successfully! Welcome to the Robotics Club!');
      onSuccess();
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-secondary mb-4 glow">
          <Sparkles className="w-8 h-8 text-secondary-foreground" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Complete Your Profile
        </h1>
        <p className="text-muted-foreground mt-2">
          Tell us a bit about yourself to get started
        </p>
        {user?.email && (
          <p className="text-sm text-primary mt-1">{user.email}</p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="full_name"
              type="text"
              placeholder="John Doe"
              className="pl-10 h-12"
              {...register('full_name')}
            />
          </div>
          {errors.full_name && (
            <p className="text-sm text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="enrollment_id">Enrollment ID</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="enrollment_id"
              type="text"
              placeholder="e.g., STU2024001"
              className="pl-10 h-12"
              {...register('enrollment_id')}
            />
          </div>
          {errors.enrollment_id && (
            <p className="text-sm text-destructive">{errors.enrollment_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="batch_number">Batch Number</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="batch_number"
              type="text"
              placeholder="e.g., 2024"
              className="pl-10 h-12"
              {...register('batch_number')}
            />
          </div>
          {errors.batch_number && (
            <p className="text-sm text-destructive">{errors.batch_number.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 text-base font-medium gradient-primary hover:opacity-90 transition-opacity mt-6"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : null}
          Complete Setup
        </Button>
      </form>
    </div>
  );
}
