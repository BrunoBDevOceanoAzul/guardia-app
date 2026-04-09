import { GoogleGenerativeAI } from "@google/generative-ai";

interface Pattern {
  type: string;
  description: string;
  severity: "info" | "warning" | "danger";
  examples: string[];
}

interface AnalysisResult {
  riskLevel: "low" | "medium" | "high" | "critical";
  score: number;
  patterns: Pattern[];
  recommendations: string[];
  summary: string;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const DANGER_PATTERNS: Array<{
  keywords: string[];
  type: string;
  severity: "danger";
}> = [
  {
    keywords: ["matar", "mato", "vou te matar", "vou morrer", "suicidio"],
    type: "AMEAÇA",
    severity: "danger",
  },
  {
    keywords: ["surra", "tapa", "soco", "espancar", "bater"],
    type: "VIOLÊNCIA FÍSICA",
    severity: "danger",
  },
  {
    keywords: ["te faco", "te destruo", "ruina", "acaba", "lamento"],
    type: "INTIMIDAÇÃO",
    severity: "danger",
  },
];

const WARNING_PATTERNS: Array<{
  keywords: string[];
  type: string;
  severity: "warning";
}> = [
  {
    keywords: ["ciumes", "ciúme", "inveja", "possessivo"],
    type: "CONTROLE POSSESSIVO",
    severity: "warning",
  },
  {
    keywords: [
      "não vai sair",
      "fica em casa",
      "não encontra",
      "quem tá com você",
      "onde tá",
    ],
    type: "CONTROLE SOCIAL",
    severity: "warning",
  },
  {
    keywords: [
      "se me abandona",
      "me deixa",
      "vai se arrepender",
      "ninguém vai te querer",
    ],
    type: "MANIPULAÇÃO EMOCIONAL",
    severity: "warning",
  },
  {
    keywords: ["pelo amor", "por favor", "meu bem", "favor"],
    type: "MANIPULAÇÃO",
    severity: "warning",
  },
  {
    keywords: ["desculpa", "não vai acontecer", "eu juro", "muda"],
    type: "CICLO DE VIOLÊNCIA",
    severity: "warning",
  },
  {
    keywords: ["celular", "whatsapp", "senha", "rastreador", "espionar"],
    type: "VIGILÂNCIA",
    severity: "warning",
  },
  {
    keywords: ["bebado", "bêbado", "droga", "cocaína", "maconha"],
    type: "USO DE SUBSTÂNCIAS",
    severity: "warning",
  },
];

export async function analyzeConversation(
  conversation: string,
  contactName: string
): Promise<AnalysisResult> {
  const lines = conversation.split("\n").filter((line) => line.trim());
  const detectedPatterns: Pattern[] = [];
  let dangerCount = 0;
  let warningCount = 0;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    for (const pattern of DANGER_PATTERNS) {
      if (pattern.keywords.some((kw) => lowerLine.includes(kw))) {
        const existing = detectedPatterns.find((p) => p.type === pattern.type);
        if (existing) {
          existing.examples.push(line);
        } else {
          detectedPatterns.push({
            type: pattern.type,
            description: getPatternDescription(pattern.type),
            severity: pattern.severity,
            examples: [line],
          });
          dangerCount++;
        }
      }
    }

    for (const pattern of WARNING_PATTERNS) {
      if (pattern.keywords.some((kw) => lowerLine.includes(kw))) {
        if (!detectedPatterns.some((p) => p.type === pattern.type)) {
          detectedPatterns.push({
            type: pattern.type,
            description: getPatternDescription(pattern.type),
            severity: pattern.severity,
            examples: [line],
          });
          warningCount++;
        }
      }
    }
  }

  let score = 0;
  score += dangerCount * 25;
  score += warningCount * 10;
  score = Math.min(100, score);

  let riskLevel: "low" | "medium" | "high" | "critical";
  if (score >= 70) riskLevel = "critical";
  else if (score >= 45) riskLevel = "high";
  else if (score >= 20) riskLevel = "medium";
  else riskLevel = "low";

  const recommendations = generateRecommendations(detectedPatterns, riskLevel);

  let summary = "";
  if (riskLevel === "critical") {
    summary = `ALERTA CRÍTICO: Identificamos múltiplos sinais graves de violência na conversa com ${contactName}. Os padrões detectados indicam alto risco de agressão física ou emocional. Recomendamos fortemente que você procure ajuda profissional e entre em contato com o Ligue 180 (Central de Atendimento à Mulher) IMEDIATAMENTE.`;
  } else if (riskLevel === "high") {
    summary = `ALERTA: A conversa com ${contactName} apresenta padrões preocupantes de comportamento controlador e possivelmente abusivo. Detectamos sinais de manipulação emocional e tentativas de isolamento social. Recomendamos cautela e, se sentir necessidade, procure apoio de amigos, familiares ou profissionais.`;
  } else if (riskLevel === "medium") {
    summary = `ATENÇÃO: Alguns comportamentos na conversa com ${contactName} merecem atenção. Foram identificados padrões que podem indicar tendências possessivas ou manipuladoras. Continue atenta e priorize sua segurança e bem-estar.`;
  } else {
    summary = `Com base na análise desta conversa, não identificamos padrões obviously preocupantes de violência ou abuso. No entanto, continue atenta e confie em seus sentimentos. Se algo parecer errado, provavelmente está.`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const enhancedPrompt = `
    Analise esta conversa do WhatsApp e forneça um resumo mais detalhado e recomendações específicas.
    
    Conversa:
    ${conversation}
    
    Resultado inicial:
    - Nível de risco: ${riskLevel}
    - Score: ${score}/100
    - Padrões encontrados: ${detectedPatterns.map((p) => p.type).join(", ")}
    
    Forneça um resumo aprimorado em português brasileiro (2-3 frases) focando nos aspectos mais importantes.`;

    const result = await model.generateContent(enhancedPrompt);
    const response = result.response;
    const enhancedSummary = response.text();

    if (enhancedSummary && enhancedSummary.length > 20) {
      summary = enhancedSummary;
    }
  } catch (_error) {
    console.log("Using basic analysis (Gemini unavailable)");
  }

  return {
    riskLevel,
    score,
    patterns: detectedPatterns,
    recommendations,
    summary,
  };
}

function getPatternDescription(type: string): string {
  const descriptions: Record<string, string> = {
    Ameaça:
      "Mensagens que contêm ameaças explícitas ou implícitas de violência.",
    "Violência Física": "Referências a agressões físicas ou uso de força.",
    Intimidação: "Mensagens com linguagem intimidatória ou destructiva.",
    "Controle Possessivo":
      "Comportamento que indica ciúmes excessivo ou possessividade.",
    "Controle Social":
      "Tentativas de controlar quem você vê, onde vai ou o que faz.",
    "Manipulação Emocional":
      "Táticas para fazer você se sentir culpada ou responsável.",
    Manipulação: "Uso de táticas emocionais para controle.",
    "Ciclo de Violência":
      "Padrão de pedido de desculpas seguido de comportamento abusivo.",
    Vigilância: "Tentativas de monitorar suas atividades ou comunicações.",
    "Uso de Substâncias": "Menções ao uso problemático de álcool ou drogas.",
  };
  return descriptions[type] || "Padrão de comportamento identificado.";
}

function generateRecommendations(
  _patterns: Pattern[],
  riskLevel: string
): string[] {
  const recs: string[] = [];

  if (riskLevel === "critical" || riskLevel === "high") {
    recs.push(
      "Ligue imediatamente para o 180 (Central de Atendimento à Mulher) ou 190 (Polícia) em caso de emergência."
    );
    recs.push(
      "Avise alguém de confiança sobre a situação (amigo, familiar, vizinho)."
    );
    recs.push(
      "Guarde evidências das mensagens em local seguro (e-mail, nuvem)."
    );
    recs.push("Não confronte a pessoa sozinha - a situação pode escalar.");
    recs.push(
      "Procure uma delegacia especializada (DEAM) ou Núcleo de Defesa da Mulher."
    );
  }

  if (riskLevel === "medium") {
    recs.push("Fique atenta a novos padrões de comportamento controlador.");
    recs.push("Mantenha um registro das conversas e interações.");
    recs.push("Converse com alguém de confiança sobre como você se sente.");
    recs.push(
      "Confie nos seus instintos - se algo parece errado, provavelmente está."
    );
  }

  if (riskLevel === "low") {
    recs.push("Continue atenta a mudanças no comportamento da pessoa.");
    recs.push("Mantenha suas redes de apoio ativas.");
    recs.push("Confie em como a conversa te faz sentir.");
  }

  recs.push(
    "Lembre-se: você não é responsável pelo comportamento abusivo de outras pessoas."
  );

  return recs;
}
