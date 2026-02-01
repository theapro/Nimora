"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Plus, Search, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Community {
  id: number;
  title: string;
  slug: string;
  description?: string;
  image?: string;
  is_active: boolean;
  post_count?: number;
  created_at: string;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    title: "",
    slug: "",
    description: "",
    image: "",
  });

  const fetchCommunities = () => {
    setLoading(true);
    api
      .get("/admin/communities")
      .then((res) =>
        setCommunities(
          Array.isArray(res.data) ? res.data : res.data.communities || [],
        ),
      )
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchCommunities();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return communities;
    return communities.filter((c) =>
      `${c.title} ${c.slug} ${c.description || ""}`.toLowerCase().includes(q),
    );
  }, [communities, search]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("communityImage", file);
      const response = await api.post("/communities/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNewCommunity((p) => ({
        ...p,
        image: response.data.imageUrl,
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!newCommunity.title || !newCommunity.slug) {
        alert("Title and slug are required");
        return;
      }
      await api.post("/communities", {
        title: newCommunity.title,
        slug: newCommunity.slug,
        description: newCommunity.description || null,
        image: newCommunity.image || null,
      });
      setCreateOpen(false);
      setNewCommunity({ title: "", slug: "", description: "", image: "" });
      fetchCommunities();
    } catch (err) {
      console.error(err);
      alert("Failed to create community");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this community?")) return;
    try {
      await api.delete(`/communities/${id}`);
      fetchCommunities();
    } catch (err) {
      console.error(err);
      alert("Failed to delete community");
    }
  };

  const handleToggleActive = async (c: Community) => {
    try {
      await api.put(`/communities/${c.id}`, {
        title: c.title,
        description: c.description || null,
        image: c.image || null,
        is_active: !c.is_active,
      });
      fetchCommunities();
    } catch (err) {
      console.error(err);
      alert("Failed to update community");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Communities</h1>
          <p className="text-sm text-gray-500">
            Create, disable/enable, delete.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or slug"
              className="pl-9"
            />
          </div>

          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All communities</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              No results
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Community</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {c.title}
                        </span>
                        <span className="text-xs text-gray-500">/{c.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell>{c.post_count ?? 0}</TableCell>
                    <TableCell>
                      {c.is_active ? (
                        <Badge variant="secondary">active</Badge>
                      ) : (
                        <Badge variant="destructive">disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleActive(c)}
                        >
                          {c.is_active ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        open={createOpen}
        title="Create community"
        onClose={() => setCreateOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={newCommunity.title}
              onChange={(e) =>
                setNewCommunity((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Nimora"
            />
          </div>

          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={newCommunity.slug}
              onChange={(e) =>
                setNewCommunity((p) => ({ ...p, slug: e.target.value }))
              }
              placeholder="nimora"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              className="min-h-24 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={newCommunity.description}
              onChange={(e) =>
                setNewCommunity((p) => ({
                  ...p,
                  description: e.target.value,
                }))
              }
              placeholder="About this community"
            />
          </div>

          <div className="space-y-2">
            <Label>Image (optional)</Label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={handleImageUpload}
                className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm"
              />
              {uploading && (
                <span className="text-xs text-gray-500 py-2">Uploading...</span>
              )}
            </div>
            {newCommunity.image && (
              <div className="mt-2">
                <img
                  src={newCommunity.image}
                  alt="Preview"
                  className="h-20 w-20 rounded border border-gray-200 object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={uploading}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
