"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const stats = [
  {
    value: "1 em 3",
    label: "Mulheres sofrem violência no mundo",
    source: "OMS",
  },
  {
    value: "1.492",
    label: "Feminicídios registrados em 2024",
    source: "Anuário Seg. Pública",
  },
  {
    value: "4 min",
    label: "Intervalo entre agressões no Brasil",
    source: "Atlas da Violência 2025",
  },
  {
    value: "Prevenção",
    label: "O primeiro passo para a liberdade",
    source: "Guardiã",
  },
];

const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Detecção de Sinais Sutis",
    description: "Nossa tecnologia identifica padrões de controle, isolamento e agressividade que muitas vezes passam despercebidos no dia a dia.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Sigilo Absoluto",
    description: "Proteção total de dados com criptografia de ponta e tecnologia anti-print. Sua identidade e conversas nunca são expostas.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Foco Educativo",
    description: "A Guardiã não é um tribunal. É um espelho que te ajuda a enxergar a realidade e buscar o apoio correto com clareza.",
  },
];

function AuthModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register" | "verify">("login");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [verifyForm, setVerifyForm] = useState({ email: "", code: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
      } else {
        if (data.code === "USER_NOT_CONFIRMED") {
          setVerifyForm({ email: loginForm.email, code: "" });
          setMode("verify");
        } else {
          alert(data.error || "Erro ao fazer login");
        }
      }
    } catch {
      alert("Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      alert("As senhas não conferem");
      return;
    }
    if (!registerForm.acceptTerms) {
      alert("Você precisa aceitar os termos de uso");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerForm.email,
          password: registerForm.password,
        }),
      });
      if (res.ok) {
        setVerifyForm({ email: registerForm.email, code: "" });
        setMode("verify");
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao criar conta");
      }
    } catch {
      alert("Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifyForm),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setMode("login");
        setLoginForm({ ...loginForm, email: verifyForm.email });
      } else {
        alert(data.error || "Erro ao verificar conta");
      }
    } catch {
      alert("Erro ao verificar conta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyForm.email }),
      });
      const data = await res.json();
      alert(data.message || data.error);
    } catch {
      alert("Erro ao reenviar código");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex mb-8 bg-black/40 rounded-2xl p-1.5 border border-zinc-800">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === "login"
                ? "bg-zinc-800 text-white shadow-lg"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Acessar
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === "register"
                ? "bg-zinc-800 text-white shadow-lg"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Cadastrar
          </button>
        </div>

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Email</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full bg-black/40 border border-zinc-800 text-white placeholder:text-zinc-700 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full bg-black/40 border border-zinc-800 text-white placeholder:text-zinc-700 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-rose-900/20 active:scale-[0.98] mt-4"
            >
              {isLoading ? "Validando..." : "Entrar com Segurança"}
            </button>
          </form>
        )}

        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Email</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                className="w-full bg-black/40 border border-zinc-800 text-white placeholder:text-zinc-700 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Senha</label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                className="w-full bg-black/40 border border-zinc-800 text-white placeholder:text-zinc-700 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Confirmar Senha</label>
              <input
                type="password"
                placeholder="Repita sua senha"
                value={registerForm.confirmPassword}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                }
                className="w-full bg-black/40 border border-zinc-800 text-white placeholder:text-zinc-700 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all"
                required
              />
            </div>
            <div className="flex items-start gap-3 mt-6">
              <input
                type="checkbox"
                id="terms"
                checked={registerForm.acceptTerms}
                onChange={(e) => setRegisterForm({ ...registerForm, acceptTerms: e.target.checked })}
                className="mt-1 w-5 h-5 rounded border-zinc-800 bg-black text-rose-600 focus:ring-rose-500/20"
              />
              <label htmlFor="terms" className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                Aceito os <Link href="/privacy" className="text-rose-500 hover:underline">Termos e a Política de Privacidade</Link>. Entendo que a Guardiã é uma ferramenta de conscientização e não substitui diagnósticos legais ou clínicos.
              </label>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-rose-900/20 active:scale-[0.98] mt-4"
            >
              {isLoading ? "Criando conta..." : "Criar Conta Segura"}
            </button>
          </form>
        )}

        {mode === "verify" && (
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-2">Verifique seu Email</h4>
              <p className="text-sm text-zinc-500 px-4">Código enviado para<br/><span className="text-zinc-300 font-semibold">{verifyForm.email}</span></p>
            </div>
            <div>
              <input
                type="text"
                placeholder="000000"
                value={verifyForm.code}
                onChange={(e) => setVerifyForm({ ...verifyForm, code: e.target.value })}
                className="w-full bg-black/40 border border-zinc-800 text-white rounded-2xl px-4 py-5 focus:outline-none focus:border-rose-500/50 text-center text-3xl tracking-[0.4em] font-black placeholder:text-zinc-800"
                required
                maxLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900 text-white py-4 rounded-2xl font-bold text-lg transition-all"
            >
              {isLoading ? "Validando..." : "Confirmar Código"}
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading}
              className="w-full text-xs text-zinc-500 hover:text-rose-500 font-bold uppercase tracking-widest transition-colors"
            >
              Reenviar Código
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-rose-500/30 selection:text-white overflow-x-hidden">
      {/* Abstract Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-rose-900/20 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[100px] opacity-30" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-40 bg-black/60 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-black tracking-tighter">
            <span className="text-rose-500">GUARDIÃ</span>
          </h1>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-white text-black hover:bg-zinc-200 px-8 py-2.5 rounded-full font-bold text-sm transition-all transform active:scale-95 shadow-lg shadow-white/10"
          >
            Acessar
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Prevenção Baseada em Tecnologia
            </div>
            
            <h2 className="text-6xl md:text-8xl font-black leading-[0.95] mb-10 tracking-tighter">
              Não espere o <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-rose-400 to-indigo-400">
                silêncio machucar.
              </span>
            </h2>
            
            <div className="max-w-2xl text-xl md:text-2xl text-zinc-400 leading-relaxed font-medium mb-12 space-y-6">
              <p>
                O abuso raramente começa com violência física. Ele nasce no controle sutil, na manipulação e no isolamento.
              </p>
              <p>
                A <span className="text-white font-bold">Guardiã</span> utiliza inteligência avançada para analisar o tom e o padrão de suas conversas, revelando sinais de alerta invisíveis aos olhos de quem está dentro do ciclo.
              </p>
            </div>

            <div className="flex flex-wrap gap-6">
              <button
                onClick={() => setShowAuth(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white px-10 py-5 rounded-[2rem] font-black text-xl transition-all shadow-2xl shadow-rose-900/40 hover:-translate-y-1 active:scale-95"
              >
                Analisar Agora
              </button>
              <Link href="/privacy" className="bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-10 py-5 rounded-[2rem] font-bold text-xl transition-all flex items-center justify-center backdrop-blur-sm">
                Privacidade Total
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 bg-zinc-900/30 border-y border-zinc-800/50 backdrop-blur-sm relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="group p-10 bg-black/40 border border-zinc-800 rounded-[2.5rem] hover:border-rose-500/50 transition-all duration-500"
              >
                <div className="text-5xl font-black text-rose-500 mb-4 group-hover:scale-110 transition-transform origin-left">
                  {stat.value}
                </div>
                <div className="text-zinc-100 font-bold text-lg leading-tight mb-2">{stat.label}</div>
                <div className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                  Fonte: {stat.source}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h3 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">Ouvir o que não é dito.</h3>
            <p className="text-zinc-500 text-xl max-w-2xl mx-auto font-medium">A Guardiã foi construída para dar visibilidade ao invisível.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {features.map((feature, i) => (
              <div
                key={i}
                className="relative p-10 bg-zinc-900/20 border border-zinc-800 rounded-[3rem] hover:bg-zinc-900/40 transition-all group"
              >
                <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-8 border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500">
                  {feature.icon}
                </div>
                <h4 className="text-2xl font-bold mb-4 tracking-tight">{feature.title}</h4>
                <p className="text-zinc-500 leading-relaxed font-medium text-lg">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-rose-600 to-indigo-700 rounded-[4rem] p-12 md:p-24 relative overflow-hidden shadow-3xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10 max-w-3xl">
              <h3 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-[0.95]">
                Sua vida é valiosa demais para ser <span className="text-black/40">vivida com medo.</span>
              </h3>
              <p className="text-xl md:text-2xl text-white/80 font-medium mb-12 leading-relaxed">
                Tome o controle da narrativa. Saiba se o que você está vivendo é amor ou um ciclo de violência silenciosa. Nosso objetivo é que você nunca precise usar os botões de emergência.
              </p>
              <button
                onClick={() => setShowAuth(true)}
                className="bg-white text-black px-12 py-5 rounded-full font-black text-2xl transition-all hover:bg-zinc-100 shadow-2xl active:scale-95"
              >
                Começar agora
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-zinc-900 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-16">
            <h1 className="text-3xl font-black tracking-tighter">GUARDIÃ</h1>
            <div className="flex gap-12 text-sm font-black uppercase tracking-widest text-zinc-500">
              <Link href="/privacy" className="hover:text-rose-500 transition-colors">Privacidade</Link>
              <a href="#" className="hover:text-rose-500 transition-colors">LGPD</a>
              <a href="#" className="hover:text-rose-500 transition-colors">Suporte</a>
            </div>
          </div>
          <div className="p-8 bg-zinc-900/30 rounded-3xl border border-zinc-800">
            <p className="text-xs text-zinc-600 leading-relaxed text-center font-bold uppercase tracking-wider">
              AVISO CRÍTICO: A Guardiã é uma plataforma educativa para detecção de padrões e conscientização. Não substitui o trabalho da Polícia Civil (197), Polícia Militar (190) ou Central de Atendimento à Mulher (180). Os dados e relatórios gerados não possuem validade jurídica como prova pericial ou laudo diagnóstico. Sua segurança física deve ser priorizada através dos canais oficiais do Estado.
            </p>
          </div>
          <p className="mt-12 text-center text-zinc-700 text-xs font-medium">
            © {new Date().getFullYear()} GUARDIÃ. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </main>
  );
}