import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="flex items-center justify-between border-b border-gray-200 pb-6">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">Social Manage</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/dashboard"><Button size="sm">Dashboard</Button></Link>
            <Link href="/create-post"><Button size="sm" variant="secondary">Create Post</Button></Link>
          </nav>
        </header>
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">Welcome</h2>
            <p className="mt-2 text-sm text-gray-600">Create your first scheduled post or explore the dashboard.</p>
            <div className="mt-4 flex gap-3">
              <Link href="/create-post"><Button>Create a Post</Button></Link>
              <Link href="/dashboard"><Button variant="secondary">View Dashboard</Button></Link>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">What’s included</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-gray-700">
              <li>Schedule Facebook posts with image support</li>
              <li>Basic analytics and calendar view</li>
              <li>WhatsApp bot setup (Pro plan)</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
