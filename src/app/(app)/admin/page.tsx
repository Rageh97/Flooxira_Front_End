"use client";
import { redirect } from "next/navigation";

export default function AdminHomePage() {
  // Redirect to users tab by default
  redirect("/admin/users");
}


