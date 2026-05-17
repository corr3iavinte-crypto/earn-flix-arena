import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Play, Wallet, TrendingUp, Users, Shield, Zap } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background" />;
  if (user) return <Navigate to="/home" />;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-header text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-white/15 p-2"><Play className="h-5 w-5 fill-current" /></div>
            <span className="text-lg font-bold">Netflilms</span>
          </div>
          <Link to="/login" className="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/25">Entrar</Link>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-12 text-center">
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">Assista vídeos.<br /><span className="opacity-90">Ganhe dinheiro de verdade.</span></h1>
          <p className="mx-auto mt-4 max-w-xl text-sm opacity-90 md:text-base">Plataforma Netflilms em Moçambique. Planos VIP a partir de 650 MZN. Retornos diários de 10% a 14%.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/signup" className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary shadow-elegant hover:opacity-90">Criar conta grátis</Link>
            <Link to="/login" className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold backdrop-blur hover:bg-white/20">Já tenho conta</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Zap, title: "Comece em 1 minuto", desc: "Cadastre-se com o seu número e comece já." },
            { icon: TrendingUp, title: "10% a 14% diário", desc: "Retornos garantidos pelo período do plano." },
            { icon: Users, title: "Equipa A/B/C", desc: "Ganhe 10%/3%/1% das indicações." },
            { icon: Wallet, title: "Saque rápido", desc: "M-Pesa e e-Mola." },
            { icon: Shield, title: "Aprovação manual", desc: "Cada depósito é verificado." },
            { icon: Play, title: "Tarefas simples", desc: "Assista 30s e receba." },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="mb-3 inline-flex rounded-lg bg-accent p-2 text-accent-foreground"><f.icon className="h-5 w-5" /></div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t bg-card py-6 text-center text-xs text-muted-foreground">
        © 2026 Netflilms · Operado em Moçambique
      </footer>
    </div>
  );
}
