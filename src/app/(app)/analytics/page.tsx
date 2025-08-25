import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>Posts per month</CardHeader>
          <CardContent>
            <div className="h-48 rounded-md border border-dashed" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Engagement</CardHeader>
          <CardContent>
            <div className="h-48 rounded-md border border-dashed" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


