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
      await api.put(`/admin/users/${id}/ban`, {
        is_banned: !currentStatus,
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to update user status");
    }
  };

  const handleRoleChange = async (id: number, role: User["role"]) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
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

      <Card className="overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-400">
            All users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800" />
              <p className="text-xs text-gray-400 mt-4 font-medium">
                Fetching users...
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-500 font-medium">
              No users found matching your search
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">User Identity</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead className="text-right pr-6">Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group">
                    <TableCell className="pl-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 leading-none mb-1">
                            {user.username}
                          </span>
                          <span className="text-[12px] text-gray-400 font-medium">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <select
                          className="h-8 rounded-lg border border-gray-100 bg-gray-50/50 px-3 text-[12px] font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:bg-white transition-all appearance-none cursor-pointer hover:bg-gray-100"
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(
                              user.id,
                              e.target.value as User["role"],
                            )
                          }
                        >
                          <option value="user">USER</option>
                          <option value="moderator">MODERATOR</option>
                          <option value="admin">ADMIN</option>
                        </select>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant={user.is_banned ? "outline" : "destructive"}
                        size="sm"
                        className="h-8 py-0"
                        onClick={() => handleBanToggle(user.id, user.is_banned)}
                      >
                        {user.is_banned ? "Restore" : "Restrict"}
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
