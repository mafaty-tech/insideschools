import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { toast } from "sonner";

interface School {
  id: string;
  name: string;
  location: string | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  post_type: "pro" | "con" | "general";
  created_at: string;
  profiles: {
    id: string;
    username: string;
  };
}

const SchoolDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [school, setSchool] = useState<School | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSchoolData();
      getCurrentUser();
    }
  }, [id]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const fetchSchoolData = async () => {
    try {
      const [schoolRes, postsRes] = await Promise.all([
        supabase.from("schools").select("*").eq("id", id).single(),
        supabase
          .from("posts")
          .select("*, profiles(id, username)")
          .eq("school_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (schoolRes.error) throw schoolRes.error;
      if (postsRes.error) throw postsRes.error;

      setSchool(schoolRes.data);
      setPosts(postsRes.data as any || []);
    } catch (error: any) {
      toast.error("Failed to load school data");
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

  const filteredPosts = posts.filter((post) => {
    if (filter === "all") return true;
    return post.post_type === filter;
  });

  const proCount = posts.filter((p) => p.post_type === "pro").length;
  const conCount = posts.filter((p) => p.post_type === "con").length;
  const generalCount = posts.filter((p) => p.post_type === "general").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">School not found</p>
      </div>
    );
  }

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
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">{school.name}</CardTitle>
                  {school.location && (
                    <CardDescription className="text-base">{school.location}</CardDescription>
                  )}
                </div>
                <Button onClick={() => navigate("/create-post")}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-success text-success-foreground">{proCount}</Badge>
                  <span className="text-sm text-muted-foreground">Pros</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{conCount}</Badge>
                  <span className="text-sm text-muted-foreground">Cons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{generalCount}</Badge>
                  <span className="text-sm text-muted-foreground">General</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Community Posts ({filteredPosts.length})</CardTitle>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Posts</SelectItem>
                    <SelectItem value="pro">Pros</SelectItem>
                    <SelectItem value="con">Cons</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredPosts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No posts yet. Be the first to share your experience!
                </p>
              ) : (
                filteredPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                          <button
                            onClick={() => navigate(`/profile/${post.profiles.id}`)}
                            className="text-sm text-muted-foreground hover:text-primary hover:underline mb-2"
                          >
                            by @{post.profiles.username}
                          </button>
                        </div>
                        <Badge variant={getPostTypeColor(post.post_type) as any}>
                          {post.post_type}
                        </Badge>
                      </div>
                      <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                      <p className="text-xs text-muted-foreground mt-4">
                        {new Date(post.created_at).toLocaleDateString()} at{" "}
                        {new Date(post.created_at).toLocaleTimeString()}
                      </p>
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

export default SchoolDetail;
