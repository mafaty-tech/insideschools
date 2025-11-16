import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, LogOut, User, PlusCircle, Search } from "lucide-react";
import { toast } from "sonner";

interface School {
  id: string;
  name: string;
  location: string | null;
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  post_type: "pro" | "con" | "general";
  created_at: string;
  profiles: {
    username: string;
  };
  schools: {
    name: string;
    id: string;
  };
}

const Home = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schoolsRes, postsRes] = await Promise.all([
        supabase.from("schools").select("*").order("created_at", { ascending: false }).limit(20),
        supabase
          .from("posts")
          .select(`
            *,
            profiles(username),
            schools(name, id)
          `)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (schoolsRes.error) throw schoolsRes.error;
      if (postsRes.error) throw postsRes.error;

      setSchools(schoolsRes.data || []);
      setRecentPosts(postsRes.data as any || []);
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <School className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">SchoolConnect</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Discussions</CardTitle>
                <CardDescription>Latest posts from the community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentPosts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No posts yet. Be the first to share!
                  </p>
                ) : (
                  recentPosts.map((post) => (
                    <Card
                      key={post.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/school/${post.schools.id}`)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              by @{post.profiles.username} • {post.schools.name}
                            </p>
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

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Find a School</CardTitle>
                <CardDescription>Search or add a new school</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search schools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button className="w-full" onClick={() => navigate("/create-post")}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredSchools.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No schools found
                    </p>
                  ) : (
                    filteredSchools.map((school) => (
                      <Card
                        key={school.id}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => navigate(`/school/${school.id}`)}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-medium">{school.name}</h4>
                          {school.location && (
                            <p className="text-sm text-muted-foreground">{school.location}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
