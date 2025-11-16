import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, School } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  username: string;
  created_at: string;
}

interface UserSchool {
  id: string;
  status: "current" | "past";
  schools: {
    id: string;
    name: string;
    location: string | null;
  };
}

interface Post {
  id: string;
  title: string;
  content: string;
  post_type: "pro" | "con" | "general";
  created_at: string;
  schools: {
    id: string;
    name: string;
  };
}

const Profile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userSchools, setUserSchools] = useState<UserSchool[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, [id]);

  const fetchProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const profileId = id || user?.id;

      if (!profileId) {
        toast.error("Profile not found");
        navigate("/");
        return;
      }

      setIsOwnProfile(!id || id === user?.id);

      const [profileRes, schoolsRes, postsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", profileId).single(),
        supabase
          .from("user_schools")
          .select("*, schools(id, name, location)")
          .eq("user_id", profileId)
          .order("added_at", { ascending: false }),
        supabase
          .from("posts")
          .select("*, schools(id, name)")
          .eq("user_id", profileId)
          .order("created_at", { ascending: false }),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (schoolsRes.error) throw schoolsRes.error;
      if (postsRes.error) throw postsRes.error;

      setProfile(profileRes.data);
      setUserSchools(schoolsRes.data as any || []);
      setPosts(postsRes.data as any || []);
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "pro":
        return "default";
      case "con":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const currentSchools = userSchools.filter((us) => us.status === "current");
  const pastSchools = userSchools.filter((us) => us.status === "past");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-full">
                  <School className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-3xl">@{profile.username}</CardTitle>
                  <CardDescription>
                    Member since {new Date(profile.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>School Connections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentSchools.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-success">Current Schools</h3>
                  <div className="grid gap-2">
                    {currentSchools.map((us) => (
                      <Card
                        key={us.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => navigate(`/school/${us.schools.id}`)}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-medium">{us.schools.name}</h4>
                          {us.schools.location && (
                            <p className="text-sm text-muted-foreground">{us.schools.location}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {pastSchools.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-muted-foreground">Past Schools</h3>
                  <div className="grid gap-2">
                    {pastSchools.map((us) => (
                      <Card
                        key={us.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => navigate(`/school/${us.schools.id}`)}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-medium">{us.schools.name}</h4>
                          {us.schools.location && (
                            <p className="text-sm text-muted-foreground">{us.schools.location}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {userSchools.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No school connections yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Posts ({posts.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {posts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No posts yet</p>
              ) : (
                posts.map((post) => (
                  <Card
                    key={post.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/school/${post.schools.id}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{post.schools.name}</p>
                        </div>
                        <Badge variant={getPostTypeColor(post.post_type) as any}>
                          {post.post_type}
                        </Badge>
                      </div>
                      <p className="text-foreground line-clamp-2">{post.content}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
