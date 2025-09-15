import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    cta: "Get started",
    features: [
      "3 posts/month",
      "Post scheduling",
      "Image uploads",
      "Basic analytics",
      "Email support (limited)",
      "Post preview",
    ],
    highlighted: false,
  },
  {
    name: "Basic",
    price: "$9.99",
    period: "/month",
    cta: "Choose Basic",
    features: [
      "20 posts/month",
      "Post scheduling",
      "Image uploads",
      "Basic analytics",
      "Email support",
      "Post preview",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19.99",
    period: "/month",
    cta: "Go Pro",
    features: [
      "50 posts/month",
      "Post scheduling",
      "Image uploads",
      "Basic analytics",
      "Priority support",
      "WhatsApp bot",
      "Post preview",
    ],
    highlighted: true,
  },
];

export default function PlansPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Plans</h1>
        <p className="text-sm text-gray-600">Pick the plan that fits your workflow. Upgrade anytime.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.highlighted ? "border-gray-900" : undefined}>
            <CardHeader>
              <div className="flex items-baseline justify-between">
                <div className="text-lg font-semibold">{plan.name}</div>
                <div className="text-2xl font-bold">{plan.price} <span className="text-sm font-normal text-gray-500">{plan.period}</span></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-700">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-gray-900" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={plan.highlighted ? "default" : "secondary"}>{plan.cta}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-gray-500">Payments via Stripe. You can cancel anytime. VAT may apply.</p>
    </div>
  );
}









