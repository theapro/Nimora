"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { MessageSquare, Heart, Eye, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Post {
  id: number;
  title: string;
  author_name: string;
  community_name: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPosts = () => {
    setLoading(true);
    api.get("/admin/posts")
      .then(res => setPosts(Array.isArray(res.data) ? res.data : res.data.posts || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Failed to delete post");
    }
  };

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.author_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Content Moderation</h1>
          <p className="text-sm text-gray-500 font-medium">Monitor and manage platform-wide discussions</p>
        </div>
        
        <div className="w-full md:w-80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts or authors"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-400">Published Posts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center">
               <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800" />
               <p className="text-xs text-gray-400 mt-4 font-medium">Loading content...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-500 font-medium">
              No posts found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Post Content</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Community</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id} className="group hover:bg-gray-50/50 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="font-semibold text-gray-900 line-clamp-1">{post.title}</div>
                      <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                        ID: #{post.id} • {new Date(post.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-gray-700">{post.author_name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white text-gray-600 font-semibold border-gray-100 uppercase tracking-tighter text-[10px]">
                        {post.community_name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-gray-400">
                        <span className="flex items-center gap-1 text-xs">
                          <Heart className="h-3 w-3" /> {post.likes_count}
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <MessageSquare className="h-3 w-3" /> {post.comments_count}
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <Eye className="h-3 w-3" /> {post.views_count}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(post.id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
