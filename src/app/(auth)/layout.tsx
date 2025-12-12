import { BorderBeam } from "@/components/ui/border-beam";
import { Card } from "@/components/ui/card";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ backgroundImage: 'url(/auth.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} className="min-h-screen flex items-center flex-col justify-center p-4 ">
        {/* <div>
        <Image src="/Logo.gif" alt="logo" width={400} height={100} />
      </div> */}
      <Card className="w-full max-w-md  gradient-border p-6">
       
          
            {children}
        
            <BorderBeam duration={8} size={100} />
      </Card>
    </main>
  );
}
