import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <Card>
        <CardHeader>Subscription</CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Plan</div>
              <div className="text-sm text-gray-500">Free Plan: 3 posts/month</div>
            </div>
            <Button>Upgrade</Button>
          </div>
          <div className="text-sm text-gray-500">Stripe integration coming soon.</div>
        </CardContent>
      </Card>
    </div>
  );
}









