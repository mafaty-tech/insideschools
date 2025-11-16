import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface School {
  id: string;
  name: string;
}

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title too long"),
  content: z.string().min(20, "Content must be at least 20 characters").max(5000, "Content too long"),
  schoolId: z.string().min(1, "Please select a school"),
  postType: z.enum(["pro", "con", "general"]),
});

const CreatePost = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [showNewSchool, setShowNewSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolLocation, setNewSchoolLocation] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"pro" | "con" | "general">("general");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchSchools();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const fetchSchools = async () => {
    const { data, error } = await supabase
      .from("schools")
      .select("id, name")
      .order("name");

    if (error) {
      toast.error("Failed to load schools");
      return;
    }

    setSchools(data || []);
  };

  const handleAddSchool = async () => {
    if (!newSchoolName.trim()) {
      toast.error("Please enter a school name");
      return;
    }

    if (!userId) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("schools")
      .insert({
        name: newSchoolName.trim(),
        location: newSchoolLocation.trim() || null,
        created_by: userId,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      if (error.message.includes("duplicate")) {
        toast.error("A school with this name already exists");
      } else {
        toast.error("Failed to add school");
      }
      return;
    }

    toast.success("School added successfully!");
    setSchools([...schools, data]);
    setSelectedSchoolId(data.id);
    setShowNewSchool(false);
    setNewSchoolName("");
    setNewSchoolLocation("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("You must be logged in to create a post");
      return;
    }

    const validation = postSchema.safeParse({
      title: title.trim(),
      content: content.trim(),
      schoolId: selectedSchoolId,
      postType,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("posts").insert({
      user_id: userId,
      school_id: selectedSchoolId,
      title: title.trim(),
      content: content.trim(),
      post_type: postType,
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to create post");
      return;
    }

    toast.success("Post created successfully!");
    navigate(`/school/${selectedSchoolId}`);
  };

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
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create a New Post</CardTitle>
              <CardDescription>Share your experience about a school</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  {!showNewSchool ? (
                    <>
                      <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a school" />
                        </SelectTrigger>
                        <SelectContent>
                          {schools.map((school) => (
                            <SelectItem key={school.id} value={school.id}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewSchool(true)}
                        className="mt-2"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add New School
                      </Button>
                    </>
                  ) : (
                    <Card className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newSchoolName">School Name</Label>
                        <Input
                          id="newSchoolName"
                          value={newSchoolName}
                          onChange={(e) => setNewSchoolName(e.target.value)}
                          placeholder="Enter school name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newSchoolLocation">Location (Optional)</Label>
                        <Input
                          id="newSchoolLocation"
                          value={newSchoolLocation}
                          onChange={(e) => setNewSchoolLocation(e.target.value)}
                          placeholder="City, State"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" onClick={handleAddSchool} disabled={loading}>
                          Add School
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowNewSchool(false)}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postType">Post Type</Label>
                  <Select value={postType} onValueChange={(v) => setPostType(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Discussion</SelectItem>
                      <SelectItem value="pro">Pro (Positive)</SelectItem>
                      <SelectItem value="con">Con (Concern)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your post a clear title"
                    maxLength={200}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your thoughts, experiences, pros, cons..."
                    rows={10}
                    maxLength={5000}
                    required
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {content.length} / 5000 characters
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Post"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreatePost;
