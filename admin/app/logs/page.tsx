"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Terminal, Activity, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Log {
  id: number;
  admin_name: string;
  action: string;
  details: string;
  created_at: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/logs")
      .then(res => setLogs(Array.isArray(res.data) ? res.data : res.data.logs || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-900 rounded-lg">
          <Terminal className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Audit Logs</h1>
          <p className="text-sm text-gray-500 font-medium">System activity and administrator actions</p>
        </div>
      </div>

      <Card className="overflow-hidden border-gray-100 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)]">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Activity stream</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="py-20 text-center">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800" />
                <p className="text-xs text-gray-400 mt-4 font-bold tracking-widest uppercase">Initializing logs...</p>
             </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-400 font-medium">
              No recent activity recorded
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6 w-40">Timestamp</TableHead>
                  <TableHead className="w-40">Administrator</TableHead>
                  <TableHead>Operation performed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="group hover:bg-gray-50/30 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-gray-900">{log.admin_name}</span>
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-gray-400" />
                        <span className="text-[13px] text-gray-700 font-medium">
                          {log.action}: <span className="text-gray-400 font-normal">{log.details}</span>
                        </span>
                      </div>
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
