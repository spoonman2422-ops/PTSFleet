
"use client";

import { useCollection } from "@/firebase";
import type { ActivityLog } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, History } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";


export default function AdminPage() {
  const { data: logs, isLoading } = useCollection<ActivityLog>("activityLogs");

  const sortedLogs = React.useMemo(() => {
    if (!logs) return [];
    return logs
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
        .slice(0, 5);
  }, [logs]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6" />
              <span>Admin Panel</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Welcome, Admin. This is where administrative controls and system overview will be displayed.</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-6 w-6" />
                            <span>Recent Activity</span>
                        </CardTitle>
                        <CardDescription>A brief log of recent user actions.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={3}><Skeleton className="h-6 w-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : sortedLogs.length > 0 ? (
                            sortedLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <div className="font-medium">{log.userName}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {log.timestamp ? format(log.timestamp.toDate(), 'Pp') : ''}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{log.action}</Badge>
                                    </TableCell>
                                    <TableCell>{log.details}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">
                                    No recent activity.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

