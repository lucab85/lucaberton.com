import { useState, useMemo } from "react";

/**
 * Self-serve production-readiness check for /production-ai-assessment/. The
 * lead-generation asset for buyers who are not ready to book a 30-minute call
 * yet: the score/tier is free, the category gap map and top actions are
 * behind an email gate ("the detailed report").
 *
 * One question per diagnostic area already on the page (see
 * `diagnosticAreas` in production-ai-assessment.astro) so the copy stays
 * consistent instead of introducing a second, disconnected framework.
 */

interface Area {
  key: string;
  n: string;
  title: string;
  question: string;
  action: string; // shown in the gated "top actions" list when this area scores low
}

const AREAS: Area[] = [
  { key: "architecture", n: "01", title: "Architecture", question: "We can trace the full request path through our AI application, and we understand the failure modes at each step.", action: "Map the request path end to end and document failure modes at each hop." },
  { key: "compute", n: "02", title: "Compute", question: "We have visibility into GPU utilization, and we can explain our scheduling and tenancy model.", action: "Instrument GPU utilization and define a scheduling and tenancy model." },
  { key: "reliability", n: "03", title: "Reliability", question: "We have defined production SLOs, failure modes and recovery objectives for our AI workloads.", action: "Define SLOs and recovery objectives for every production AI workload." },
  { key: "observability", n: "04", title: "Observability", question: "We have logs, traces and model-level telemetry that we actually use to catch problems before users do.", action: "Close the observability gap: logs, traces and model telemetry teams actually watch." },
  { key: "security", n: "05", title: "Security", question: "We have clear identity, access and secrets management for every AI-related credential and data path.", action: "Close identity, access and secrets gaps across every AI data path." },
  { key: "governance", n: "06", title: "Governance", question: "We have documented approvals, policies and audit evidence for how AI is used in production.", action: "Document approvals, policies and audit evidence for production AI use." },
  { key: "cost", n: "07", title: "Cost", question: "We can explain our AI cost per workload, including idle GPU capacity and accelerator spend.", action: "Instrument cost per workload, including idle GPU capacity." },
  { key: "platform", n: "08", title: "Platform", question: "We have a shared platform for AI workloads instead of one-off, project-by-project infrastructure.", action: "Consolidate project-by-project AI infrastructure onto a shared platform." },
];

const SCALE = [
  { value: 0, label: "Not yet" },
  { value: 5, label: "Partially" },
  { value: 10, label: "Fully" },
];

const TIERS = [
  { max: 40, title: "Prototype stage", description: "Production is not the risk yet — the use case and its economics are. Prove the use case before hardening the platform around it." },
  { max: 70, title: "Scaling stage", description: "The foundations exist, but real gaps sit between your current setup and something the organization can safely run at scale." },
  { max: 100, title: "Production-ready stage", description: "Most of the operating system is in place. The remaining gaps are usually about proof — evidence, not architecture." },
];

function tierFor(score: number) {
  return TIERS.find((t) => score <= t.max) ?? TIERS[TIERS.length - 1];
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

type Step = number; // 0..AREAS.length-1 = quiz pages, length = email gate, length+1 = report

export default function ProductionReadinessCheck() {
  const [step, setStep] = useState<Step>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const web3formsKey = import.meta.env.PUBLIC_WEB3FORMS_KEY || "";

  const emailStepIndex = AREAS.length;
  const reportStepIndex = AREAS.length + 1;
  const currentArea = step < AREAS.length ? AREAS[step] : null;

  const totalScore = useMemo(
    () => Math.round((AREAS.reduce((sum, a) => sum + (answers[a.key] ?? 0), 0) / (AREAS.length * 10)) * 100),
    [answers],
  );
  const tier = tierFor(totalScore);
  const lowestAreas = useMemo(
    () => [...AREAS].sort((a, b) => (answers[a.key] ?? 0) - (answers[b.key] ?? 0)).slice(0, 3),
    [answers],
  );

  const select = (value: number) => {
    if (!currentArea) return;
    setAnswers((prev) => ({ ...prev, [currentArea.key]: value }));
    setStep((s) => s + 1);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    if (!isValidEmail(email)) return;
    setEmailStatus("sending");
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: web3formsKey,
        subject: "Production AI Readiness Check result",
        from_name: "Production AI Readiness Check",
        email,
        score: totalScore,
        tier: tier.title,
        gaps: lowestAreas.map((a) => a.title).join(", "),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) { setEmailStatus("error"); return; }
        setEmailStatus("sent");
        const w = window as any;
        if (typeof w.lucaTrack === "function") w.lucaTrack("assessment_submit", { target_offer: "production_ai_assessment" });
        else if (typeof w.gtag === "function") w.gtag("event", "assessment_submit", { target_offer: "production_ai_assessment" });
        setStep(reportStepIndex);
      })
      .catch(() => setEmailStatus("error"));
  };

  return (
    <div className="readiness-check max-w-2xl mx-auto">
      {step <= emailStepIndex && (
        <div className="mb-6">
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>{step < AREAS.length ? `Question ${step + 1} of ${AREAS.length}` : "Last step"}</span>
            <span>{Math.round((step / AREAS.length) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div className="h-full rounded-full bg-red-600 transition-all duration-500" style={{ width: `${(step / AREAS.length) * 100}%` }} />
          </div>
        </div>
      )}

      {currentArea && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:p-8">
          <span className="text-xs font-black text-red-500">{currentArea.n} · {currentArea.title.toUpperCase()}</span>
          <p className="mt-4 text-xl font-bold leading-snug text-white">{currentArea.question}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {SCALE.map((s) => {
              const selected = answers[currentArea.key] === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => select(s.value)}
                  className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                    selected
                      ? "border-red-500 bg-red-600 text-white"
                      : "border-slate-600 bg-slate-800 text-slate-200 hover:border-red-500 hover:bg-red-600 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="mt-6 text-sm font-semibold text-slate-500 hover:text-slate-300">
              ← Back
            </button>
          )}
        </div>
      )}

      {step === emailStepIndex && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center sm:p-8">
          <p className="text-4xl font-black text-white"><span data-testid="readiness-score">{totalScore}</span><span className="text-lg font-bold text-slate-500"> / 100</span></p>
          <h3 className="mt-2 text-xl font-bold text-white">{tier.title}</h3>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Enter your email to see your category gap map and the top 3 actions to close it first — this is the detailed report, not another sales follow-up.
          </p>
          <form onSubmit={handleEmailSubmit} className="mx-auto mt-6 max-w-sm space-y-2 text-left" noValidate>
            <input
              type="email"
              inputMode="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={emailTouched && !isValidEmail(email)}
              aria-describedby="readiness-email-error"
              className="w-full rounded-md border-2 border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500"
            />
            {emailTouched && !isValidEmail(email) && (
              <p id="readiness-email-error" role="alert" className="text-sm font-semibold text-red-400">Enter a valid email to see your report.</p>
            )}
            <button
              type="submit"
              disabled={emailStatus === "sending"}
              className="w-full rounded-lg bg-red-600 px-8 py-3 font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {emailStatus === "sending" ? "Sending…" : "See my report"}
            </button>
            {emailStatus === "error" && (
              <p className="text-center text-sm text-red-400">
                Something went wrong — try again, or{" "}
                <a
                  href="https://calendly.com/lucaberton/"
                  data-track-event="consulting_cta_click"
                  data-tp-target-offer="production_ai_assessment"
                  data-tp-cta-position="inline_50"
                  data-tp-cta-variant="readiness_check_email_error_fallback"
                  className="underline hover:text-red-300"
                >book a call directly</a>.
              </p>
            )}
          </form>
          <div className="mx-auto mt-4 flex max-w-sm items-center justify-between text-sm font-semibold">
            <button type="button" onClick={() => setStep((s) => s - 1)} className="text-slate-500 hover:text-slate-300">
              ← Back
            </button>
            {emailStatus === "error" && (
              <button type="button" onClick={() => setStep(reportStepIndex)} className="text-slate-500 hover:text-slate-300">
                Continue without confirmation →
              </button>
            )}
          </div>
        </div>
      )}

      {step === reportStepIndex && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:p-8">
          <div className="text-center">
            <p className="text-4xl font-black text-white"><span data-testid="readiness-score">{totalScore}</span><span className="text-lg font-bold text-slate-500"> / 100</span></p>
            <h3 className="mt-2 text-xl font-bold text-white">{tier.title}</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">{tier.description}</p>
          </div>

          <div className="mt-8 space-y-3">
            {AREAS.map((a) => {
              const v = answers[a.key] ?? 0;
              return (
                <div key={a.key} className="flex items-center justify-between gap-4 border-b border-slate-800 pb-2 text-sm">
                  <span className="font-semibold text-slate-300">{a.n} · {a.title}</span>
                  <span className={`text-xs font-black uppercase ${v <= 5 ? "text-red-500" : "text-emerald-500"}`}>
                    {SCALE.find((s) => s.value === v)?.label ?? "Not yet"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Start here</p>
            <ol className="mt-3 space-y-2 text-sm text-slate-300">
              {lowestAreas.map((a, i) => <li key={a.key}>{String(i + 1).padStart(2, "0")} · {a.action}</li>)}
            </ol>
          </div>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="https://calendly.com/lucaberton/"
              data-track-event="consulting_cta_click"
              data-tp-target-offer="production_ai_assessment"
              data-tp-cta-position="inline_50"
              data-tp-cta-variant="readiness_check_report_book_call"
              className="inline-flex items-center justify-center rounded-full bg-red-600 px-7 py-3.5 font-black text-white shadow-lg shadow-red-600/25 transition hover:-translate-y-0.5 hover:bg-red-500"
            >
              Talk through these gaps →
            </a>
            <button
              type="button"
              onClick={() => { setAnswers({}); setEmail(""); setEmailStatus("idle"); setEmailTouched(false); setStep(0); }}
              className="text-sm font-semibold text-slate-500 hover:text-slate-300"
            >
              Retake the check
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
