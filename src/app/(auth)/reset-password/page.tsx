"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { resetPasswordRequest } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const mutation = useMutation({
    mutationFn: () => resetPasswordRequest(email, token, password),
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Reset password</h1>
        <p className="text-sm text-gray-600">Please enter your new password.</p>
      </div>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (password !== confirm) return; mutation.mutate(); }}>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Token</label>
          <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste token from email/dev" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">New password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm password</label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
        </div>
        <Button className="w-full" disabled={mutation.isPending || password !== confirm}>{mutation.isPending ? "Resetting..." : "Reset password"}</Button>
        {password !== confirm && <p className="text-sm text-red-600">Passwords do not match</p>}
        {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
        <div className="text-sm text-center"><Link href="/sign-in" className="text-gray-700 hover:underline">Back to sign in</Link></div>
      </form>
    </div>
  );
}


