"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Report {
  id: number;
  reporter_name: string;
  reason: string;
  post_id: number;
  post_title: string;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    setLoading(true);
    api.get("/admin/reports")
      .then(res => setReports(Array.isArray(res.data) ? res.data : res.data.reports || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleStatusUpdate = async (id: number, status: "resolved" | "dismissed") => {
    try {
      await api.put(`/admin/reports/${id}`, { status });
      fetchReports();
    } catch (err) {
      console.error(err);
      alert("Failed to update report status");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Post Reports</h1>
        <p className="text-sm text-gray-500 font-medium">Review and resolve reported content</p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-400">Reports Queue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center">
               <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800" />
               <p className="text-xs text-gray-400 mt-4 font-medium">Checking reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-500 font-medium">
              No pending reports
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Post</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} className="group hover:bg-gray-50/50 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="font-semibold text-gray-900 leading-tight">{report.post_title}</div>
                      <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-medium">
                        Reported by {report.reporter_name} • {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600 font-medium">{report.reason}</p>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={`font-bold uppercase tracking-widest text-[9px] px-2 py-0.5 ${
                          report.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-100" :
                          report.status === "resolved" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          "bg-gray-50 text-gray-500 border-gray-200"
                        }`}
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {report.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => handleStatusUpdate(report.id, "resolved")}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            onClick={() => handleStatusUpdate(report.id, "dismissed")}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
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
