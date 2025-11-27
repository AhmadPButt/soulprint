import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, ArrowLeft, User, Mail, Globe, Users, Fingerprint } from "lucide-react";
import { motion } from "framer-motion";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [soulprint, setSoulprint] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    travel_companion: "",
    dietary_preferences: "",
    avatar_url: ""
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      setUser(session.user);

      // Load respondent data
      const { data: respondent, error: respondentError } = await supabase
        .from('respondents')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (respondentError) throw respondentError;

      setProfile(respondent);
      setFormData({
        name: respondent.name || "",
        email: respondent.email || "",
        country: respondent.country || "",
        travel_companion: respondent.travel_companion || "",
        dietary_preferences: respondent.dietary_preferences || "",
        avatar_url: respondent.avatar_url || ""
      });

      // Load SoulPrint data
      const { data: scores } = await supabase
        .from('computed_scores')
        .select('*')
        .eq('respondent_id', respondent.id)
        .single();

      if (scores) {
        setSoulprint(scores);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please upload an image file",
          variant: "destructive"
        });
        return;
      }

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));

      toast({
        title: "Success",
        description: "Avatar uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('respondents')
        .update({
          name: formData.name,
          country: formData.country,
          travel_companion: formData.travel_companion,
          dietary_preferences: formData.dietary_preferences,
          avatar_url: formData.avatar_url
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={formData.avatar_url} alt={formData.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {formData.name?.charAt(0)?.toUpperCase() || <User className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">
                  Hello, {formData.name || 'Traveler'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage your profile settings
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="rounded-full"
                title="View SoulPrint Dashboard"
              >
                <Fingerprint className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </motion.div>

        {/* Avatar Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Upload your avatar image</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={formData.avatar_url} alt={formData.name} />
                <AvatarFallback className="text-2xl bg-primary/10">
                  {formData.name?.charAt(0)?.toUpperCase() || <User className="h-12 w-12" />}
                </AvatarFallback>
              </Avatar>
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Avatar
                    </>
                  )}
                </Button>
              </Label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Details */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <User className="h-4 w-4 inline mr-2" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">
                    <Globe className="h-4 w-4 inline mr-2" />
                    Country
                  </Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Your country"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="travel_companion">
                    <Users className="h-4 w-4 inline mr-2" />
                    Travel Companion Preference
                  </Label>
                  <Input
                    id="travel_companion"
                    value={formData.travel_companion}
                    onChange={(e) => setFormData(prev => ({ ...prev, travel_companion: e.target.value }))}
                    placeholder="e.g., Solo, Partner, Group"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dietary_preferences">
                    Dietary Preferences
                  </Label>
                  <Textarea
                    id="dietary_preferences"
                    value={formData.dietary_preferences}
                    onChange={(e) => setFormData(prev => ({ ...prev, dietary_preferences: e.target.value }))}
                    placeholder="Any dietary restrictions or preferences..."
                    rows={3}
                  />
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* SoulPrint Summary */}
        {soulprint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Your SoulPrint Summary</CardTitle>
                <CardDescription>Key insights from your travel personality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {soulprint.dominant_element && (
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-1">Dominant Element</p>
                      <p className="text-lg font-semibold capitalize">{soulprint.dominant_element}</p>
                    </div>
                  )}
                  {soulprint.tribe && (
                    <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/20">
                      <p className="text-sm text-muted-foreground mb-1">Traveler Tribe</p>
                      <p className="text-lg font-semibold capitalize">{soulprint.tribe}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">Top Motivations</h4>
                  <div className="flex gap-2 flex-wrap">
                    {soulprint.top_motivation_1 && (
                      <span className="px-3 py-1 bg-accent/10 border border-accent/30 rounded-full text-sm">
                        {soulprint.top_motivation_1}
                      </span>
                    )}
                    {soulprint.top_motivation_2 && (
                      <span className="px-3 py-1 bg-accent/10 border border-accent/30 rounded-full text-sm">
                        {soulprint.top_motivation_2}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="w-full"
                >
                  View Full SoulPrint
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;
