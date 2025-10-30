export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ backgroundImage: 'url(/ooo.png)',  }} className="min-h-screen grid place-items-center p-4 ">
      <div className="w-full max-w-md rounded-xl gradient-border p-6">
        {children}
      </div>
    </main>
  );
}









