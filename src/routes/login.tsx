import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Play, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { phoneToEmail } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const nav = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(phone), password,
    });
    setLoading(false);
    if (error) { setError("Número ou senha inválidos."); return; }
    toast.success("Bem-vindo de volta!");
    nav({ to: "/home" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-card">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="rounded-lg bg-primary p-2 text-primary-foreground"><Play className="h-5 w-5 fill-current" /></div>
          <span className="text-xl font-bold">Stream<span className="text-primary">Cash</span></span>
        </div>
        <h1 className="text-3xl font-extrabold text-center">Bem vindo de volta!</h1>
        <p className="mt-2 text-center text-muted-foreground">Faça login na sua conta.</p>

        {error && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">• {error}</div>}

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border bg-muted/50 px-4 py-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <input type="tel" placeholder="Número de telefone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="flex-1 bg-transparent outline-none" />
          </div>
          <div className="flex items-center gap-3 rounded-2xl border bg-muted/50 px-4 py-3">
            <Lock className="h-5 w-5 text-warning" />
            <input type={show ? "text" : "password"} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="flex-1 bg-transparent outline-none" />
            <button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}</button>
          </div>
          <div className="text-right text-sm font-semibold text-primary">Esqueceu sua senha?</div>
          <button disabled={loading} className="w-full rounded-2xl bg-primary py-3.5 font-bold text-primary-foreground shadow-elegant hover:opacity-90 disabled:opacity-60">
            {loading ? "A entrar…" : "Conecte-se"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não tem uma conta? <Link to="/signup" className="font-bold text-primary">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
