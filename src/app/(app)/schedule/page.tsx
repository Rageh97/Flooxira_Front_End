import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Schedule</h1>
      <Card>
        <CardHeader>Calendar (placeholder)</CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {Array.from({ length: 35 }).map((_, idx) => (
              <div key={idx} className="h-20 rounded-md border border-gray-200 bg-white" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


