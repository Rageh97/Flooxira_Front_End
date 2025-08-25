"use client";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Forgot password</h1>
        <p className="text-sm text-gray-600">We’ll send you a reset link if there’s an account with that email.</p>
      </div>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </div>
        <Button className="w-full">Send reset link</Button>
        <div className="text-sm text-center"><Link href="/sign-in" className="text-gray-700 hover:underline">Back to sign in</Link></div>
      </form>
    </div>
  );
}


