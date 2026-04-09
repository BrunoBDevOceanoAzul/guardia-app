"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/app/providers";
import {
  formatCPF,
  formatPhone,
  validateCPF,
  validateEmail,
  validatePassword,
  validatePhone,
} from "@/lib/validators";

export default function RegisterPage() {
  const _router = useRouter();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [isWoman, setIsWoman] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cpfValid, setCpfValid] = useState<boolean | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "name":
        if (value.trim().length < 2) return "Nome completo é obrigatório";
        if (value.trim().split(" ").length < 2)
          return "Digite nome e sobrenome";
        return "";
      case "cpf":
        if (!validateCPF(value)) return "CPF inválido";
        return "";
      case "email":
        if (!validateEmail(value)) return "E-mail inválido";
        return "";
      case "phone":
        if (!validatePhone(value)) return "Telefone inválido";
        return "";
      case "password": {
        const passwordResult = validatePassword(value);
        return passwordResult.valid ? "" : passwordResult.errors[0];
      }
      case "confirmPassword":
        if (value !== formData.password) return "Senhas não coincidem";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === "cpf") {
      formattedValue = formatCPF(value);
      const cleanValue = value.replace(/\D/g, "");
      if (cleanValue.length === 11) {
        const isValid = validateCPF(cleanValue);
        setCpfValid(isValid);
      } else {
        setCpfValid(null);
      }
    }

    if (field === "phone") {
      formattedValue = formatPhone(value);
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));

    if (touched[field]) {
      const error = validateField(
        field,
        field === "cpf" ? value.replace(/\D/g, "") : value
      );
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value =
      field === "cpf"
        ? formData.cpf.replace(/\D/g, "")
        : (formData as Record<string, string>)[field];
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const isFormValid = () => {
    const fields = [
      "name",
      "cpf",
      "email",
      "phone",
      "password",
      "confirmPassword",
    ];
    for (const field of fields) {
      const value =
        field === "cpf"
          ? formData.cpf.replace(/\D/g, "")
          : formData[field as keyof typeof formData];
      if (validateField(field, value)) return false;
    }
    return isWoman && acceptPrivacy;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const allTouched: Record<string, boolean> = {};
    const allErrors: Record<string, string> = {};

    ["name", "cpf", "email", "phone", "password", "confirmPassword"].forEach(
      (field) => {
        allTouched[field] = true;
        const value =
          field === "cpf"
            ? formData.cpf.replace(/\D/g, "")
            : formData[field as keyof typeof formData];
        const error = validateField(field, value);
        if (error) allErrors[field] = error;
      }
    );

    setTouched(allTouched);
    setErrors(allErrors);

    if (!isWoman) {
      setError("Este serviço é exclusivo para mulheres.");
      return;
    }

    if (!acceptPrivacy) {
      setError("Você precisa aceitar a política de privacidade.");
      return;
    }

    if (Object.keys(allErrors).length > 0) return;

    setIsLoading(true);

    try {
      await signUp({
        name: formData.name,
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ""),
        password: formData.password,
        cpf: formData.cpf.replace(/\D/g, ""),
      });
      setConfirmationSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  if (confirmationSent) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-6">📧</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            E-mail de confirmação enviado
          </h1>
          <p className="text-zinc-400 mb-8">
            Enviamos um código de confirmação para{" "}
            <span className="text-white font-medium">{formData.email}</span>.
            <br />
            Verifique sua caixa de entrada.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-lg transition-colors"
          >
            Ir para login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🛡️</span>
            <span className="text-2xl font-bold text-white">Guardiã</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Crie sua conta
          </h1>
          <p className="text-zinc-400 text-center mb-6">
            Proteja-se de conversas perigosas
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-300 mb-2"
              >
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                placeholder="Seu nome e sobrenome"
                className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-colors ${
                  touched.name && errors.name
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-zinc-700 focus:border-rose-500 focus:ring-rose-500"
                }`}
              />
              {touched.name && errors.name && (
                <p className="mt-1 text-xs text-red-400">{errors.name}</p>
              )}
            </div>

            {/* CPF */}
            <div>
              <label
                htmlFor="cpf"
                className="block text-sm font-medium text-zinc-300 mb-2"
              >
                CPF
              </label>
              <div className="relative">
                <input
                  id="cpf"
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => handleChange("cpf", e.target.value)}
                  onBlur={() => handleBlur("cpf")}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-colors ${
                    touched.cpf && errors.cpf
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-zinc-700 focus:border-rose-500 focus:ring-rose-500"
                  }`}
                />
                {cpfValid === true && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                    ✓
                  </span>
                )}
                {cpfValid === false && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                    ✗
                  </span>
                )}
              </div>
              {touched.cpf && errors.cpf && (
                <p className="mt-1 text-xs text-red-400">{errors.cpf}</p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                Validamos seu CPF na Receita Federal
              </p>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-300 mb-2"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="seu@email.com"
                className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-colors ${
                  touched.email && errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-zinc-700 focus:border-rose-500 focus:ring-rose-500"
                }`}
              />
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-zinc-300 mb-2"
              >
                WhatsApp
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                onBlur={() => handleBlur("phone")}
                placeholder="(00) 00000-0000"
                className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-colors ${
                  touched.phone && errors.phone
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-zinc-700 focus:border-rose-500 focus:ring-rose-500"
                }`}
              />
              {touched.phone && errors.phone && (
                <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-300 mb-2"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                placeholder="Mínimo 8 caracteres"
                className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-colors ${
                  touched.password && errors.password
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-zinc-700 focus:border-rose-500 focus:ring-rose-500"
                }`}
              />
              {touched.password && errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                Mínimo 8 caracteres, 1 maiúscula, 1 número, 1 símbolo
              </p>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-zinc-300 mb-2"
              >
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                onBlur={() => handleBlur("confirmPassword")}
                placeholder="Repita a senha"
                className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-colors ${
                  touched.confirmPassword && errors.confirmPassword
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-zinc-700 focus:border-rose-500 focus:ring-rose-500"
                }`}
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Checkboxes */}
            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWoman}
                  onChange={(e) => setIsWoman(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-rose-500 focus:ring-rose-500"
                />
                <span className="text-sm text-zinc-300">
                  Sou mulher e tenho 18 anos ou mais
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={(e) => setAcceptPrivacy(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-rose-500 focus:ring-rose-500"
                />
                <span className="text-sm text-zinc-300">
                  Li e aceito a{" "}
                  <Link
                    href="/privacy"
                    className="text-rose-400 hover:underline"
                  >
                    Política de Privacidade
                  </Link>{" "}
                  e os{" "}
                  <Link href="/terms" className="text-rose-400 hover:underline">
                    Termos de Uso
                  </Link>
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors mt-6"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Criando conta...
                </span>
              ) : (
                "Criar minha conta"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-400">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-rose-400 hover:text-rose-300 font-medium transition-colors"
            >
              Entrar
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          ⚠️ Este serviço é exclusivo para mulheres. Dados sensíveis são
          protegidos conforme LGPD.
        </p>
      </div>
    </main>
  );
}
