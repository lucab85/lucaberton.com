import { useState, useEffect, useMemo } from "react";

interface Category {
  key: string;
  label: string;
  emoji: string;
  questions: string[];
}

const CATEGORIES: Category[] = [
  {
    key: "architecture",
    label: "Architecture & Inference",
    emoji: "🧩",
    questions: [
      "Explaining the request path through an AI application",
      "Comparing hosted APIs and self-hosted models",
      "Identifying model-serving components",
      "Defining latency and throughput requirements",
      "Designing for failure",
    ],
  },
  {
    key: "kubernetes",
    label: "Kubernetes & Compute",
    emoji: "☸️",
    questions: [
      "Deploying an inference workload",
      "Defining resource requests and limits",
      "Explaining GPU scheduling",
      "Isolating multiple workloads",
      "Automating the environment",
    ],
  },
  {
    key: "reliability",
    label: "Reliability & Observability",
    emoji: "📈",
    questions: [
      "Identifying AI-platform service-level indicators",
      "Instrumenting logs, metrics and traces",
      "Designing rollback procedures",
      "Identifying capacity bottlenecks",
      "Creating an operational runbook",
    ],
  },
  {
    key: "security",
    label: "Security & Governance",
    emoji: "🔐",
    questions: [
      "Managing model and application access",
      "Protecting credentials and secrets",
      "Defining data boundaries",
      "Evaluating third-party dependencies",
      "Documenting production controls",
    ],
  },
  {
    key: "cost",
    label: "Cost & Communication",
    emoji: "💶",
    questions: [
      "Estimating the cost per workload",
      "Comparing cloud and dedicated compute",
      "Explaining trade-offs to leadership",
      "Creating a production-readiness review",
      "Presenting an architecture recommendation",
    ],
  },
];

const SCALE = [
  { value: 0, label: "Not yet" },
  { value: 1, label: "A little" },
  { value: 2, label: "Somewhat" },
  { value: 3, label: "Mostly" },
  { value: 4, label: "Confidently" },
];

const TIERS = [
  {
    max: 25,
    title: "Infrastructure foundation",
    description:
      "You have useful infrastructure skills but need an AI workload map and a guided first deployment.",
  },
  {
    max: 50,
    title: "AI-aware operator",
    description:
      "You understand several concepts but need end-to-end implementation experience.",
  },
  {
    max: 75,
    title: "Emerging AI platform engineer",
    description:
      "You can build major components but need stronger operational depth and architecture evidence.",
  },
  {
    max: 100,
    title: "Production-capable practitioner",
    description:
      "You can make meaningful AI-platform contributions and should focus on advanced scale, governance and leadership.",
  },
];

function tierFor(score: number) {
  return TIERS.find((t) => score <= t.max) ?? TIERS[TIERS.length - 1];
}

function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("event", event, { event_category: "conversion", ...params });
  }
}

type Step = number; // 0..CATEGORIES.length-1 = quiz pages, length = email step, length+1 = results

export default function ReadinessScorecard() {
  const [step, setStep] = useState<Step>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const web3formsKey = (import.meta as any).env?.PUBLIC_WEB3FORMS_KEY || "";

  const emailStepIndex = CATEGORIES.length;
  const resultsStepIndex = CATEGORIES.length + 1;

  const currentCategory = step < CATEGORIES.length ? CATEGORIES[step] : null;

  const isCategoryComplete = (catIndex: number) =>
    CATEGORIES[catIndex].questions.every((_, qIndex) => answers[`${catIndex}-${qIndex}`] !== undefined);

  const categoryScores = useMemo(
    () =>
      CATEGORIES.map((cat, catIndex) => {
        const raw = cat.questions.reduce(
          (sum, _, qIndex) => sum + (answers[`${catIndex}-${qIndex}`] ?? 0),
          0
        );
        return { ...cat, raw, max: cat.questions.length * 4, percent: Math.round((raw / (cat.questions.length * 4)) * 100) };
      }),
    [answers]
  );

  const totalScore = useMemo(
    () => categoryScores.reduce((sum, c) => sum + c.raw, 0),
    [categoryScores]
  );

  const tier = tierFor(totalScore);

  useEffect(() => {
    if (step === resultsStepIndex) {
      track("scorecard_completed", { score: totalScore });
    }
  }, [step]);

  const selectAnswer = (qIndex: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [`${step}-${qIndex}`]: value }));
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStep(resultsStepIndex);
      return;
    }
    setEmailStatus("sending");
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: web3formsKey,
        subject: "AI Platform Engineer Readiness Scorecard result",
        from_name: "AI Platform Engineer Readiness Scorecard",
        name: name || "Not provided",
        email,
        score: totalScore,
        tier: tier.title,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setEmailStatus(data.success ? "sent" : "error");
        if (data.success) track("scorecard_email_captured");
      })
      .catch(() => setEmailStatus("error"))
      .finally(() => setStep(resultsStepIndex));
  };

  const scoreRingStyle = {
    background: `conic-gradient(#f59e0b 0%, #f97316 ${Math.max(totalScore - 15, 0)}%, #ef4444 ${totalScore}%, #e5e7eb ${totalScore}%)`,
  };

  return (
    <div className="scorecard-results max-w-3xl mx-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .scorecard-results, .scorecard-results * { visibility: visible; }
          .scorecard-results { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Progress */}
      {step <= emailStepIndex && (
        <div className="no-print mb-8">
          <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>{step < CATEGORIES.length ? `Category ${step + 1} of ${CATEGORIES.length}` : "Almost done"}</span>
            <span>{Math.round((step / (CATEGORIES.length + 1)) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(step / (CATEGORIES.length + 1)) * 100}%`, background: "var(--grad-brand)" }}
            />
          </div>
        </div>
      )}

      {/* Quiz pages */}
      {currentCategory && (
        <div className="spotlight-card grad-border bg-white rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>{currentCategory.emoji}</span> {currentCategory.label}
          </h2>
          <p className="text-gray-500 mt-1 mb-6">Rate how confident you are, right now, in each of these.</p>
          <div className="space-y-6">
            {currentCategory.questions.map((q, qIndex) => (
              <div key={qIndex}>
                <p className="font-medium text-gray-800 mb-2">{q}</p>
                <div className="flex flex-wrap gap-2">
                  {SCALE.map((s) => {
                    const selected = answers[`${step}-${qIndex}`] === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => selectAnswer(qIndex, s.value)}
                        className={`chip border transition-all ${
                          selected
                            ? "text-white border-transparent"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-amber-300"
                        }`}
                        style={selected ? { background: "var(--grad-brand)" } : undefined}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-6 py-3 font-semibold rounded-lg text-gray-600 disabled:opacity-0 hover:bg-gray-100 transition-all"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!isCategoryComplete(step)}
              className="px-8 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
            >
              {step === CATEGORIES.length - 1 ? "See my results" : "Next"}
            </button>
          </div>
        </div>
      )}

      {/* Optional email capture */}
      {step === emailStepIndex && (
        <div className="spotlight-card grad-border bg-white rounded-2xl p-6 sm:p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Want your result emailed to you?</h2>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">Optional — you'll see your results either way.</p>
          <form onSubmit={handleEmailSubmit} className="mt-6 max-w-sm mx-auto space-y-3 text-left">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <button
              type="submit"
              disabled={emailStatus === "sending"}
              className="w-full px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all"
            >
              {emailStatus === "sending" ? "Sending…" : "Email me my results"}
            </button>
            <button
              type="button"
              onClick={() => setStep(resultsStepIndex)}
              className="w-full px-8 py-3 text-gray-500 hover:text-gray-700 font-semibold transition-all"
            >
              Skip and see my results
            </button>
          </form>
        </div>
      )}

      {/* Results */}
      {step === resultsStepIndex && (
        <div>
          <div className="spotlight-card grad-border bg-white rounded-2xl p-6 sm:p-8 text-center">
            <div
              className="mx-auto w-40 h-40 rounded-full flex items-center justify-center"
              style={scoreRingStyle}
            >
              <div className="w-32 h-32 rounded-full bg-white flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-gray-900">{totalScore}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">/ 100</span>
              </div>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">{tier.title}</h2>
            <p className="mt-2 text-gray-600 max-w-lg mx-auto leading-relaxed">{tier.description}</p>

            <div className="mt-8 space-y-4 text-left max-w-lg mx-auto">
              {categoryScores.map((c) => (
                <div key={c.key}>
                  <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1">
                    <span>{c.emoji} {c.label}</span>
                    <span>{c.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.percent}%`, background: "var(--grad-brand)" }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="no-print mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/ai-platform-engineer-bootcamp/"
                className="inline-flex items-center justify-center px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/25 transition-all text-lg"
              >
                Join the AI Platform Engineer Bootcamp
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition-all text-lg"
              >
                Save as PDF
              </button>
            </div>
            <p className="no-print mt-4 text-xs text-gray-400">
              Your next step is not another general AI course. It is building one
              complete production-shaped platform.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
