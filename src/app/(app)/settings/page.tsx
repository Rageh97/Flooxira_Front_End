import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card>
        <CardHeader>Profile</CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input placeholder="name@example.com" type="email" />
          </div>
          <div className="md:col-span-2 mt-2">
            <Button>Save</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>Integrations</CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Facebook</div>
              <div className="text-sm text-gray-500">Connect your Facebook account</div>
            </div>
            <Button variant="secondary">Connect</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


