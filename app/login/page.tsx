import Link from "next/link";
import { LoginFlow } from "@/components/login-flow";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; setup?: string }>;
}) {
  const resolvedParams = await searchParams;
  const next = resolvedParams.next || "/";
  const error = resolvedParams.error;
  const initialSetup = resolvedParams.setup === "true";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 font-sans relative overflow-hidden">

      <div className="absolute top-8 left-8 z-10">
        <Link href="/" className="flex items-center gap-2 font-bold text-sm tracking-tight text-primary/80 hover:text-primary transition-colors motion-fluid duration-200">
          <img src="/tubelens.png" alt="TubeLens Logo" className="h-5 w-auto object-contain opacity-80" />
          TubeLens
        </Link>
      </div>

      <LoginFlow next={next} initialError={error} initialSetup={initialSetup} />
    </div>
  );
}
