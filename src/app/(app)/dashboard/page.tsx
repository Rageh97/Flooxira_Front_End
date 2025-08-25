import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>Scheduled</CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <div className="text-sm text-gray-500">posts in queue</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Published</CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <div className="text-sm text-gray-500">last 7 days</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Engagement</CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0%</div>
            <div className="text-sm text-gray-500">avg rate</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>Recent activity</CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
            <li>No activity yet.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}


