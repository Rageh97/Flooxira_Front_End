export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen grid place-items-center p-4 bg-gradient-custom">
      <div className="w-full max-w-md rounded-lg gradient-border p-6">
        {children}
      </div>
    </main>
  );
}









