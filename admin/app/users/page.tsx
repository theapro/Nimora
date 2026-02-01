"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Ban, ShieldCheck, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin" | "moderator";
  is_banned: boolean;
  is_verified?: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = () => {
    setLoading(true);
    api
      .get("/admin/users")
      .then((res) =>
        setUsers(Array.isArray(res.data) ? res.data : res.data.users || []),
      )
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleBanToggle = async (id: number, currentStatus: boolean) => {
    try {
      fetchUsers();
      await api.put(`/users/${id}/ban`, { is_banned: !currentStatus });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to update user status");
    }
  };

  const handleRoleChange = async (id: number, role: User["role"]) => {
    try {
      fetchUsers();
      await api.put(`/users/${id}/role`, { role });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to update role");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-gray-500">
            Search, change roles, ban/unban.
          </p>
        </div>
        <div className="w-full max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username or email"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Loading…
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              No results
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {user.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-gray-400" />
                        <select
                          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm"
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(
                              user.id,
                              e.target.value as User["role"],
                            )
                          }
                        >
                          <option value="user">user</option>
                          <option value="moderator">moderator</option>
                          <option value="admin">admin</option>
                        </select>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_banned ? (
                        <Badge variant="destructive">banned</Badge>
                      ) : (
                        <Badge variant="secondary">active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={user.is_banned ? "secondary" : "destructive"}
                        size="sm"
                        onClick={() => handleBanToggle(user.id, user.is_banned)}
                      >
                        <Ban className="h-4 w-4" />
                        {user.is_banned ? "Unban" : "Ban"}
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
