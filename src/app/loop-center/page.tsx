import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LoopCenter } from "@/components/loop-center/loop-center";

export default function LoopCenterPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-loop-sand">
        <TopNav />
        <main className="mx-auto max-w-5xl px-4 py-10">
          <LoopCenter />
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
