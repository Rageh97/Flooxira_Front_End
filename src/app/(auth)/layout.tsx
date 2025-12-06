import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ backgroundImage: 'url(/ooo.png)',  }} className="min-h-screen flex items-center flex-col justify-center p-4 ">
        <div>
        <Image src="/Logo.gif" alt="logo" width={400} height={100} />
      </div>
      <div className="w-full max-w-md rounded-xl gradient-border p-6">
        {children}
      </div>
    </main>
  );
}









