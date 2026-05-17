import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Play, User, Phone, Lock, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { phoneToEmail } from "@/lib/format";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/signup")({
  validateSearch: (s) => ({ ref: typeof s.ref === "string" ? s.ref : undefined }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const search = useSearch({ from: "/signup" });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode] = useState(search.ref ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const schema = z.object({
      name: z.string().trim().min(2).max(80),
      phone: z.string().trim().regex(/^\d{8,12}$/),
      password: z.string().min(4).max(72),
    });
    const r = schema.safeParse({ name, phone, password });
    if (!r.success) { setError("Verifique os dados (telefone só dígitos, senha 4+)."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: phoneToEmail(phone), password,
      options: {
        data: { full_name: name, phone, referred_by_code: refCode || undefined },
        emailRedirectTo: `${window.location.origin}/home`,
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    toast.success("Conta criada! A entrar…");
    nav({ to: "/home" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-card">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="rounded-lg bg-primary p-2 text-primary-foreground"><Play className="h-5 w-5 fill-current" /></div>
          <span className="text-xl font-bold">Stream<span className="text-primary">Cash</span></span>
        </div>
        <h1 className="text-3xl font-extrabold text-center">Criar conta</h1>
        <p className="mt-2 text-center text-muted-foreground">Cadastre-se e comece a ganhar.</p>

        {error && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">• {error}</div>}

        <form onSubmit={submit} className="mt-6 space-y-3">
          <Field icon={User}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" required className="flex-1 bg-transparent outline-none" /></Field>
          <Field icon={Phone}><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Número de telefone (ex: 841234567)" required className="flex-1 bg-transparent outline-none" /></Field>
          <Field icon={Lock}><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha (mín. 4 caracteres)" required minLength={4} className="flex-1 bg-transparent outline-none" /></Field>
          <Field icon={Gift}><input value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} placeholder="Código de indicação (opcional)" className="flex-1 bg-transparent outline-none uppercase" /></Field>
          <button disabled={loading} className="w-full rounded-2xl bg-primary py-3.5 font-bold text-primary-foreground shadow-elegant hover:opacity-90 disabled:opacity-60">
            {loading ? "A criar…" : "Cadastre-se"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta? <Link to="/login" className="font-bold text-primary">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-muted/50 px-4 py-3">
      <Icon className="h-5 w-5 text-muted-foreground" />{children}
    </div>
  );
}
