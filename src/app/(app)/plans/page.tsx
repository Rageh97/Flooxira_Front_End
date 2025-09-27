"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listPlans, type Plan } from "@/lib/api";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    
    setLoading(true);
    listPlans(token)
      .then((res) => setPlans(res.plans.filter(plan => plan.isActive)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const formatPrice = (priceCents: number, interval: string) => {
    const price = (priceCents / 100).toFixed(2);
    const period = interval === 'yearly' ? '/year' : '/month';
    return { price: `$${price}`, period };
  };

  const formatFeatures = (features: any) => {
    if (Array.isArray(features)) {
      return features;
    }
    if (typeof features === 'string') {
      try {
        const parsed = JSON.parse(features);
        return Array.isArray(parsed) ? parsed : [features];
      } catch {
        return [features];
      }
    }
    return [];
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Plans</h1>
          <p className="text-sm text-gray-600">Pick the plan that fits your workflow. Upgrade anytime.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <div className="mt-4 h-10 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Plans</h1>
          <p className="text-sm text-gray-600">Pick the plan that fits your workflow. Upgrade anytime.</p>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">Error loading plans: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Plans</h1>
        <p className="text-sm text-gray-600">Pick the plan that fits your workflow. Upgrade anytime.</p>
      </div>
      
      {plans.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No plans available at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => {
            const { price, period } = formatPrice(plan.priceCents, plan.interval);
            const features = formatFeatures(plan.features);
            const isHighlighted = index === 1; // Highlight the middle plan
            
            return (
              <Card key={plan.id} className={isHighlighted ? "border-gray-900" : undefined}>
                <CardHeader>
                  <div className="flex items-baseline justify-between">
                    <div className="text-lg font-semibold">{plan.name}</div>
                    <div className="text-2xl font-bold">
                      {price} <span className="text-sm font-normal text-gray-500">{period}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-gray-700">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-gray-900" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={isHighlighted ? "default" : "secondary"}
                  >
                    Choose {plan.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      <p className="text-xs text-gray-500">Payments via Stripe. You can cancel anytime. VAT may apply.</p>
    </div>
  );
}









