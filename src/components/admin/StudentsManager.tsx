import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Search, Trash2, UserCog, ArrowUpDown, Filter } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  enrollment_id: string;
  batch_number: string;
  xp_points: number;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'member';
}

export function StudentsManager() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [sortBy, setSortBy] = useState<'name' | 'enrollment' | 'xp'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [xpFilter, setXpFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role'),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (rolesRes.data) setRoles(rolesRes.data as UserRole[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getUserRole = (userId: string) => {
    const userRole = roles.find(r => r.user_id === userId);
    return userRole?.role || 'member';
  };

  const toggleAdminRole = async (userId: string, currentRole: string) => {
    if (currentRole === 'admin') {
      // Remove admin role
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'member' })
        .eq('user_id', userId);
      
      if (error) {
        toast.error('Failed to update role');
        return;
      }
      toast.success('Admin role removed');
    } else {
      // Add admin role
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', userId);
      
      if (error) {
        toast.error('Failed to update role');
        return;
      }
      toast.success('Admin role granted');
    }
    fetchData();
  };

  const deleteStudent = async (profile: Profile) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profile.id);

    if (error) {
      toast.error('Failed to delete student');
      return;
    }
    toast.success('Student deleted');
    fetchData();
  };

  const filteredProfiles = profiles
    .filter(p => {
      const matchesSearch = 
        p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        p.enrollment_id.toLowerCase().includes(search.toLowerCase()) ||
        p.batch_number.toLowerCase().includes(search.toLowerCase());
      
      let matchesXpFilter = true;
      if (xpFilter === 'high') matchesXpFilter = p.xp_points >= 1000;
      else if (xpFilter === 'medium') matchesXpFilter = p.xp_points >= 500 && p.xp_points < 1000;
      else if (xpFilter === 'low') matchesXpFilter = p.xp_points < 500;
      
      return matchesSearch && matchesXpFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.full_name.localeCompare(b.full_name);
      } else if (sortBy === 'enrollment') {
        comparison = a.enrollment_id.localeCompare(b.enrollment_id);
      } else if (sortBy === 'xp') {
        comparison = a.xp_points - b.xp_points;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, enrollment ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={xpFilter} onValueChange={(v: 'all' | 'high' | 'medium' | 'low') => setXpFilter(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="XP Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All XP</SelectItem>
              <SelectItem value="high">High (≥1000)</SelectItem>
              <SelectItem value="medium">Medium (500-999)</SelectItem>
              <SelectItem value="low">Low (&lt;500)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(v: 'name' | 'enrollment' | 'xp') => setSortBy(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="enrollment">Enrollment ID</SelectItem>
              <SelectItem value="xp">XP Points</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>

        <Badge variant="secondary">{filteredProfiles.length} students</Badge>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Enrollment ID</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>XP Points</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">{profile.full_name}</TableCell>
                <TableCell>{profile.enrollment_id}</TableCell>
                <TableCell>{profile.batch_number}</TableCell>
                <TableCell>
                  <Badge 
                    variant={profile.xp_points >= 1000 ? 'default' : profile.xp_points >= 500 ? 'secondary' : 'outline'}
                  >
                    {profile.xp_points} XP
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getUserRole(profile.user_id) === 'admin' ? 'default' : 'secondary'}>
                    {getUserRole(profile.user_id)}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAdminRole(profile.user_id, getUserRole(profile.user_id))}
                    >
                      <UserCog className="w-4 h-4 mr-1" />
                      {getUserRole(profile.user_id) === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Student</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {profile.full_name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteStudent(profile)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredProfiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No students found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
