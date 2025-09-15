export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen grid place-items-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {children}
      </div>
    </main>
  );
}









