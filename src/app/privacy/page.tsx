"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#FCFAFA] text-stone-800 selection:bg-rose-200 selection:text-stone-900">
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/70 backdrop-blur-xl border-b border-stone-100/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold flex items-center gap-2 tracking-tight">
            <span className="text-rose-500">Guardiã</span>
          </Link>
          <Link
            href="/"
            className="text-stone-500 hover:text-stone-800 font-medium transition-colors"
          >
            Voltar para Início
          </Link>
        </div>
      </nav>

      <section className="pt-32 pb-24 px-6 relative">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-300/20 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-stone-100 text-stone-700 rounded-full text-sm font-semibold mb-6 border border-stone-200/50">
            Transparência e Confiança
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-stone-900 tracking-tight">
            Privacidade e Uso de Dados
          </h1>
          
          <div className="prose prose-stone prose-lg max-w-none text-stone-600 leading-relaxed">
            <p>
              A Sua segurança e o sigilo de suas informações são nosso compromisso fundamental. Nós da Guardiã estruturamos toda a plataforma com ferramentas de proteção e anonimização de dados a partir da <strong>Lei Geral de Proteção de Dados (LGPD)</strong>.
            </p>

            <div className="bg-rose-50 border-l-4 border-rose-400 p-6 rounded-r-xl my-8">
              <h3 className="text-rose-900 font-bold m-0 mb-2">Atenção: Propósito Educacional e Limitações</h3>
              <p className="text-rose-800 m-0">
                A Guardiã é uma ferramenta estritamente com intuito de ajudar a prevenir e informar indicativos e sinais de alerta em conversas. <strong>NÓS NÃO OFERECEMOS DIAGNÓSTICOS</strong> clínicos, psicológicos ou legais. Os resultados, análises e relatórios gerados por esta plataforma <strong>NUNCA DEVEM SER USADOS COMO PROVA</strong> ou parecer técnico em processos judiciais, delegacias ou litígios de qualquer natureza. Se você estiver sob risco, entre em contato com as autoridades.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-stone-900 mt-10 mb-4">
              Como protegemos seus dados?
            </h2>
            <ul className="space-y-3">
              <li><strong>Anonimização Automática:</strong> Antes de qualquer análise, as informações que possam lhe identificar (PII - Personally Identifiable Information) como nomes, telefones, e-mails e CPFs, são automaticamente disfarçados (hasheados).</li>
              <li><strong>Sem Exposição:</strong> Implementamos tecnologias anti-screenshot (prevenção de capturas de tela) em nossa plataforma para inibir o salvamento superficial e o vazamento local das suas informações.</li>
              <li><strong>Descarte e Retenção:</strong> Textos e mensagens enviadas para a análise de IA não retroalimentam as inteligências artificiais com seus dados pessoais reais, e evitamos retenção de conversas em formato legível duradouro.</li>
            </ul>

            <h2 className="text-2xl font-bold text-stone-900 mt-10 mb-4">
              Sobre a Inteligência Artificial
            </h2>
            <p>
              Utilizamos a tecnologia Gemini para investigar comportamentos que frequentemente se caracterizam como ciclos de abuso. O objetivo é fornecer a você um contexto sobre <em>"o que significa isso?"</em> e apontar alertas antes de uma potencial piora de comportamento. As IAs, contudo, são passíveis de erros, não compreendendo falas de duplo sentido em sua totalidade, por isso o caráter é sempre educativo e reflexivo.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mt-10 mb-4">
              Direitos do Titular (LGPD)
            </h2>
            <p>
              Como usuário (a), você detém todos os direitos previstos na legislação brasileira, incluindo a capacidade de exclusão definitiva da conta, revogação de acessos, confirmação dos seus dados e anonimato garantido.
            </p>

            <div className="mt-12 pt-8 border-t border-stone-200">
              <p className="text-sm text-stone-500">
                Ligue <strong>180</strong> (Central de Atendimento à Mulher) para denúncias seguras ou busque orientação especializada em sua cidade. Em caso emergencial, ligue para o <strong>190</strong> (Polícia Militar).
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
