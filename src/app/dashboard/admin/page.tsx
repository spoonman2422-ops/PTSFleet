import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
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
    </div>
  );
}
