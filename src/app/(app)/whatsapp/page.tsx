import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function WhatsAppPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">WhatsApp Bot</h1>
      <Card>
        <CardHeader>Setup</CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Business Number</label>
            <Input placeholder="e.g. +1 555 123 4567" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Welcome Message</label>
            <Textarea placeholder="Hello! How can we help you today?" />
          </div>
          <div className="flex gap-3">
            <Button>Save</Button>
            <Button variant="secondary">Test</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


