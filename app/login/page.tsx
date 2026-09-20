import { login, signup } from "./actions";
import Link from "next/link";
import { Play } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const resolvedParams = await searchParams;
  const next = resolvedParams.next || "/";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 font-sans selection:bg-accent/20 selection:text-primary">
      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary hover:opacity-80 transition-opacity">
          <div className="h-6 w-6 bg-primary text-background rounded flex items-center justify-center">
            <Play className="h-3 w-3 ml-0.5 fill-current" />
          </div>
          TubeLens
        </Link>
      </div>

      <div className="w-full max-w-md space-y-10">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-balance">
            Welcome to your workspace.
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to continue to TubeLens
          </p>
        </div>

        <form className="space-y-5 bg-background p-8 rounded-2xl border border-border shadow-editorial">
          <input type="hidden" name="next" value={next} />
          
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full bg-secondary/30 text-foreground rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all border border-border focus:border-accent placeholder:text-muted-foreground/60"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full bg-secondary/30 text-foreground rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all border border-border focus:border-accent placeholder:text-muted-foreground/60"
            />
          </div>

          {resolvedParams.error && (
            <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-lg border border-destructive/20 text-center font-medium">
              {resolvedParams.error}
            </div>
          )}

          <div className="pt-4 space-y-3 flex flex-col">
            <button
              formAction={login}
              className="w-full h-12 items-center justify-center rounded-lg bg-primary text-background text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              Sign In
            </button>
            <button
              formAction={signup}
              className="w-full h-12 items-center justify-center rounded-lg bg-secondary/50 text-foreground border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
