"use client";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Reset password</h1>
        <p className="text-sm text-gray-600">Please enter your new password.</p>
      </div>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">New password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm password</label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
        </div>
        <Button className="w-full">Reset password</Button>
        <div className="text-sm text-center"><Link href="/sign-in" className="text-gray-700 hover:underline">Back to sign in</Link></div>
      </form>
    </div>
  );
}


