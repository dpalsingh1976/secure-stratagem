import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  HeartPulse,
  HelpCircle,
  Hourglass,
  Loader2,
  Rocket,
  Shield,
  Snowflake,
  TrendingDown,
  TrendingUp,
  Unlock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import type { CanvasView } from "@/components/iul-planner/Canvas";
import { type IulPlannerApi, localOnlyApi } from "@/lib/iul-planner/api";
import ResultsPanel from "@/components/iul-planner/ResultsPanel";
import PlanPanel from "@/components/iul-planner/PlanPanel";
import { SCENARIO_BY_ID, SCENARIO_DECK } from "@/components/iul-planner/scenarios";
import {
  type DualInput,
  type Gender,
  type HouseholdInput,
  type LifeEvent,
  assessIulFit,
  defaultInput,
  fmtUsd,
  fmtUsdExact,
  needsAnalysis,
  projectDual,
  riskCurve,
  termMonthlyPremium,
} from "@/lib/iul-planner/engine";

// ─── Flow ─────────────────────────────────────────────────────────────────────

/**
 * Two phases. Discovery works out what the household is actually short and
 * splits it into term and permanent; the plan screen hands those two numbers
 * over, and the IUL phase starts from the permanent one.
 */
type Stage =
  | "welcome" | "you" | "family" | "assets" | "debts" | "plan"
  | "amount" | "grow" | "access" | "life" | "summary" | "done";

const FLOW: Stage[] = [
  "welcome", "you", "family", "assets", "debts", "plan",
  "amount", "grow", "access", "life", "summary", "done",
];

/** Discovery stages, before there is anything to project. */
const DISCOVERY: Stage[] = ["you", "family", "assets", "debts"];

const STAGE_TITLE: Record<Stage, string> = {
  welcome: "Start", you: "About you", family: "Your family",
  assets: "What you own", debts: "What you owe", plan: "Your plan",
  amount: "Your monthly amount", grow: "How it grows",
  access: "Using the money", life: "If life happens",
  summary: "Your summary", done: "Done",
};

const STAGE_CHART: Record<Stage, CanvasView> = {
  welcome: "growth", you: "growth", family: "hump", assets: "hump",
  debts: "hump", plan: "hump", amount: "allocation",
  grow: "growth", access: "access", life: "scenarios",
  summary: "scenarios", done: "scenarios",
};

/** Before a monthly amount exists, any figure here would be built from
 *  defaults the client never entered — so these stages show the value story
 *  instead, and the numbers appear the moment there is a real budget. */
const STAGE_HEADLINE: Partial<Record<Stage, string>> = {
  amount: "Move the amount on the left and watch these change.",
  grow: "Same money, different decades. See how the ups and downs play out.",
  access: "What you can take out later, and when.",
  life: "Pick something that could happen. The numbers update to show how it lands.",
};

/**
 * History presets. Labelled by the period, never by the outcome — a label like
 * "the rough years" sets up an expectation the arithmetic then contradicts,
 * because while you are paying IN, an early downturn costs very little (the
 * balance is still small) and the good years that follow land on a much bigger
 * balance. Naming them neutrally lets the numbers make their own point.
 */
const HISTORY_PRESETS = [
  { start: 1995, label: "If you'd started in 1995", sub: "A long bull run, then the dot-com crash" },
  { start: 2000, label: "If you'd started in 2000", sub: "Two crashes early, strong recovery after" },
  { start: 1970, label: "If you'd started in 1970", sub: "High inflation and a hard first decade" },
];

// ─── Profile ──────────────────────────────────────────────────────────────────

interface Profile {
  // You
  age: number; gender: Gender; smoker: boolean; annualIncome: number;
  incomeStability: "stable" | "variable" | "uncertain";
  // Family
  hasPartner: boolean; partnerIncome: number;
  numChildren: number; youngestChildAge: number; retirementAge: number;
  // What you own
  homeValue: number; retirementAccounts: number;
  savingsAndInvestments: number; otherAssets: number;
  employerMatchCaptured: boolean; maxedTaxAdvantaged: boolean;
  // What you owe
  mortgageBalance: number; otherDebts: number;
  existingLifeCoverage: number; highInterestDebt: boolean;
  // The IUL phase
  monthlyBudget: number; canSustainIncomeDrop: boolean;
  capRate: number; windowStart: number;
  incomeStartAge: number; annualIncomeTarget: number;
  // Contact
  firstName: string; lastName: string; email: string; phone: string;
}

const INITIAL: Profile = {
  age: 38, gender: "male", smoker: false, annualIncome: 140_000,
  incomeStability: "stable",
  hasPartner: true, partnerIncome: 60_000,
  numChildren: 2, youngestChildAge: 4, retirementAge: 65,
  homeValue: 600_000, retirementAccounts: 200_000,
  savingsAndInvestments: 60_000, otherAssets: 0,
  employerMatchCaptured: true, maxedTaxAdvantaged: false,
  mortgageBalance: 350_000, otherDebts: 20_000,
  existingLifeCoverage: 0, highInterestDebt: false,
  monthlyBudget: 900, canSustainIncomeDrop: true,
  capRate: 9, windowStart: 1995,
  incomeStartAge: 65, annualIncomeTarget: 40_000,
  firstName: "", lastName: "", email: "", phone: "",
};

// ─── Building blocks ──────────────────────────────────────────────────────────

function Choice({
  label, description, selected, onClick, icon,
}: {
  label: string; description?: string; selected: boolean; onClick: () => void; icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${
        selected ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      {icon && (
        <span className={`mt-0.5 rounded-lg p-1.5 ${selected ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"}`}>
          {icon}
        </span>
      )}
      <span className="min-w-0">
        <span className={`block text-sm font-semibold ${selected ? "text-teal-800" : "text-slate-800"}`}>{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-snug text-slate-500">{description}</span>}
      </span>
      {selected && <CheckCircle2 className="ml-auto mt-0.5 h-5 w-5 shrink-0 text-teal-500" />}
    </button>
  );
}

function Range({
  label, value, min, max, step, format, onChange, hint,
}: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void; hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label className="text-sm font-medium text-slate-700">{label}</Label>
        <span className="text-xl font-bold text-teal-600">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600"
      />
      {hint && <div className="text-[11px] text-slate-400">{hint}</div>}
    </div>
  );
}

function NumberField({
  label, value, onChange, prefix,
}: { label: string; value: number; onChange: (v: number) => void; prefix?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{prefix}</span>}
        <Input
          type="number" value={value === 0 ? "" : value} placeholder="0"
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={prefix ? "pl-7" : ""}
        />
      </div>
    </div>
  );
}

function Note({ children, tone = "teal" }: { children: React.ReactNode; tone?: "teal" | "amber" }) {
  const tones = {
    teal: "border-teal-200 bg-teal-50 text-teal-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
  }[tone];
  return <div className={`rounded-xl border p-3.5 text-sm leading-relaxed ${tones}`}>{children}</div>;
}

const SCENARIO_ICONS: Record<string, React.ReactNode> = {
  briefcase: <Briefcase className="h-4 w-4" />,
  "trending-down": <TrendingDown className="h-4 w-4" />,
  "heart-pulse": <HeartPulse className="h-4 w-4" />,
  rocket: <Rocket className="h-4 w-4" />,
  "graduation-cap": <GraduationCap className="h-4 w-4" />,
  shield: <Shield className="h-4 w-4" />,
  hourglass: <Hourglass className="h-4 w-4" />,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IULPlanner({
  api = localOnlyApi,
}: { api?: IulPlannerApi } = {}) {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("welcome");
  const [p, setP] = useState<Profile>(INITIAL);
  const [atAge, setAtAge] = useState(65);
  const [scenarios, setScenarios] = useState<Record<string, number>>({});
  const [questions, setQuestions] = useState<string[]>([]);
  const [crashDemo, setCrashDemo] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const [explaining, setExplaining] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stage]);

  function set(updates: Partial<Profile>) {
    setP((prev) => {
      const next = { ...prev, ...updates };
      if (updates.age !== undefined) {
        if (next.incomeStartAge < updates.age + 10) next.incomeStartAge = updates.age + 10;
        if (next.retirementAge < updates.age + 5) next.retirementAge = updates.age + 5;
        setAtAge((a) => Math.max(a, updates.age! + 1));
      }
      return next;
    });
  }

  // ── Model ───────────────────────────────────────────────────────────────────

  /** Everything the analysis needs, gathered in four short screens. */
  const household = useMemo<HouseholdInput>(
    () => ({
      age: p.age, gender: p.gender, smoker: p.smoker, annualIncome: p.annualIncome,
      hasPartner: p.hasPartner, partnerIncome: p.partnerIncome,
      numChildren: p.numChildren, youngestChildAge: p.youngestChildAge,
      retirementAge: p.retirementAge,
      homeValue: p.homeValue, retirementAccounts: p.retirementAccounts,
      savingsAndInvestments: p.savingsAndInvestments, otherAssets: p.otherAssets,
      mortgageBalance: p.mortgageBalance, otherDebts: p.otherDebts,
      existingLifeCoverage: p.existingLifeCoverage,
      highInterestDebt: p.highInterestDebt,
      employerMatchCaptured: p.employerMatchCaptured,
      maxedTaxAdvantaged: p.maxedTaxAdvantaged,
      incomeStability: p.incomeStability,
    }),
    [p],
  );

  const analysis = useMemo(() => needsAnalysis(household), [household]);
  const verdict = useMemo(() => assessIulFit(household, analysis), [household, analysis]);

  const risk = useMemo(
    () => riskCurve({
      age: p.age, annualIncome: p.annualIncome, mortgageBalance: p.mortgageBalance,
      otherDebts: p.otherDebts, numChildren: p.numChildren,
      youngestChildAge: p.youngestChildAge, retirementAge: p.retirementAge,
      existingCoverage: p.existingLifeCoverage,
    }),
    [p.age, p.annualIncome, p.mortgageBalance, p.otherDebts, p.numChildren, p.youngestChildAge, p.retirementAge, p.existingLifeCoverage],
  );

  const events = useMemo<LifeEvent[]>(() => {
    const list: LifeEvent[] = [];
    for (const [id, atEventAge] of Object.entries(scenarios)) {
      const card = SCENARIO_BY_ID[id];
      if (card) list.push(...card.build(atEventAge));
    }
    if (crashDemo) list.push({ kind: "market_shock", atAge: p.age + 5, returnPct: -38.5 });
    return list;
  }, [scenarios, crashDemo, p.age]);

  /**
   * The projection runs the plan the analysis recommended: the term it sized,
   * and the permanent face it sized, funded at whatever monthly amount the
   * client chooses in the IUL phase.
   */
  const input = useMemo<DualInput>(
    () => defaultInput({
      age: p.age, gender: p.gender, smoker: p.smoker,
      monthlyBudget: p.monthlyBudget,
      termFace: analysis.recommendedTermFace,
      termYears: analysis.recommendedTermYears,
      iulFace: analysis.recommendedPermanentFace > 0 ? analysis.recommendedPermanentFace : undefined,
      fundingYears: Math.max(5, Math.min(p.retirementAge - p.age, 30)),
      incomeStartAge: ["access", "life", "summary", "done"].includes(stage) ? p.incomeStartAge : 0,
      annualIncomeTarget: p.annualIncomeTarget,
      incomeYears: 25,
      crediting: { floor: 0, cap: p.capRate, participation: 100 },
      windowStart: p.windowStart,
      events,
    }),
    [p, analysis, events, stage],
  );

  const projection = useMemo(() => projectDual(input), [input]);

  const termPremium = termMonthlyPremium(
    analysis.recommendedTermFace, p.age, analysis.recommendedTermYears, p.gender, p.smoker,
  );
  const at65 = projection.iul.find((y) => y.age === 65) ?? projection.iul[projection.iul.length - 1];
  const shown = projection.iul.find((y) => y.age === atAge) ?? at65;

  const eventAges = useMemo(
    () => Object.entries(scenarios).map(([id, a]) => ({ age: a, label: SCENARIO_BY_ID[id]?.label.slice(0, 16) ?? "" })),
    [scenarios],
  );

  const idx = FLOW.indexOf(stage);
  const progress = Math.round((idx / (FLOW.length - 1)) * 100);
  /** Discovery asks questions and shows nothing — there is no result yet. */
  const discovery = DISCOVERY.includes(stage);

  function next() { const n = FLOW[idx + 1]; if (n) setStage(n); }
  function back() { const b = FLOW[idx - 1]; if (b) setStage(b); }

  function flagQuestion(note: string) {
    setQuestions((prev) => (prev.includes(note) ? prev : [...prev, note]));
  }

  async function explainSimply() {
    setExplainOpen(true);
    setExplainText("");
    setExplaining(true);
    try {
      const text = await api.explain(STAGE_TITLE[stage], {
          "your age": p.age,
          "paying in each month": fmtUsdExact(projection.meta.monthlyIntoVehicle),
          [`total paid in by age ${atAge}`]: fmtUsdExact(shown?.cumulativePremium ?? 0),
          [`balance at age ${atAge}`]: fmtUsdExact(shown?.netCashValue ?? 0),
          "protection for the family": fmtUsdExact(shown?.payoutOnDeath ?? 0),
          "term recommended": fmtUsdExact(analysis.recommendedTermFace),
          "permanent recommended": fmtUsdExact(analysis.recommendedPermanentFace),
          "growth cap": `${p.capRate}%`,
          "worst year possible": "0% — the balance does not fall",
      });
      setExplainText(text);
    } catch {
      setExplainText("Couldn't load that just now. The numbers on screen are calculated on your device and are unaffected.");
    } finally {
      setExplaining(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    try {
      await api.submitLead({
        firstName: p.firstName || undefined,
        lastName: p.lastName || undefined,
        email: p.email || undefined,
        phone: p.phone || undefined,
        age: p.age,
        annualIncome: p.annualIncome,
        monthlyBudget: p.monthlyBudget,
        termFace: analysis.recommendedTermFace,
        termYears: analysis.recommendedTermYears,
        permanentFace: projection.meta.iulFace,
        projectedValueAt65: at65?.netCashValue ?? 0,
        suitability: verdict.status,
        questionsRaised: questions,
        scenariosPlayed: Object.keys(scenarios).map((id) => SCENARIO_BY_ID[id]?.label ?? id),
      });
      setSubmitted(true);
      setStage("done");
    } catch {
      setSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Welcome ─────────────────────────────────────────────────────────────────

  if (stage === "welcome") {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
            <TrendingUp className="h-8 w-8 text-teal-600" />
          </div>
          <Badge variant="secondary" className="mb-4 border-teal-200 bg-teal-50 text-teal-700">
            Takes about 4 minutes
          </Badge>
          <h1 className="mb-4 text-4xl font-bold leading-tight text-slate-900">
            If your income stopped tomorrow, would your family be alright?
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-slate-600">
            A few simple questions about what you earn, own and owe. We'll work out exactly what
            they'd need, what you already have covered, and what's missing — then show you the
            cheapest way to close it.
          </p>

          <div className="mb-8 grid gap-3 text-left sm:grid-cols-3">
            {[
              { icon: <Shield className="h-4 w-4" />, t: "A real number", d: "Exactly what you're short, worked out from your own figures." },
              { icon: <Snowflake className="h-4 w-4" />, t: "The cheapest way to cover it", d: "How much term, and how much needs to be permanent." },
              { icon: <Unlock className="h-4 w-4" />, t: "An honest answer", d: "If you're already covered, we'll tell you that." },
            ].map((f) => (
              <div key={f.t} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 inline-flex rounded-lg bg-teal-50 p-2 text-teal-600">{f.icon}</div>
                <div className="text-sm font-semibold text-slate-900">{f.t}</div>
                <div className="mt-1 text-xs leading-snug text-slate-500">{f.d}</div>
              </div>
            ))}
          </div>

          <Button size="lg" onClick={next} className="rounded-xl bg-teal-600 px-8 py-6 text-base hover:bg-teal-700">
            Work out my number <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="mt-6 text-xs text-slate-400">
            An estimate for learning purposes — not a policy illustration or a recommendation to buy.
          </p>
        </div>
      </div>
    );
  }

  // ── Main ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50" ref={topRef}>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            PolicyClarity
          </button>
          <div className="hidden flex-1 items-center gap-3 sm:flex">
            <Progress value={progress} className="h-1.5 max-w-xs" />
            <span className="text-xs text-slate-500">{STAGE_TITLE[stage]}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={explainSimply} className="ml-auto gap-1.5 text-xs text-slate-500">
            <HelpCircle className="h-3.5 w-3.5" />
            Explain this simply
          </Button>
        </div>
      </header>

      <main
        className={
          discovery
            ? "mx-auto max-w-xl px-6 py-8"
            : "mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]"
        }
      >
        <div className="space-y-5">
          {stage === "you" && (
            <Card title="First, a little about you">
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Your age" value={p.age} onChange={(v) => set({ age: Math.max(18, Math.min(75, v)) })} />
                <NumberField label="Your income" value={p.annualIncome} onChange={(v) => set({ annualIncome: v })} prefix="$" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["male", "female", "other"] as Gender[]).map((g) => (
                  <Choice key={g} label={g[0].toUpperCase() + g.slice(1)} selected={p.gender === g} onClick={() => set({ gender: g })} />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Choice label="I don't smoke" selected={!p.smoker} onClick={() => set({ smoker: false })} />
                <Choice label="I smoke" selected={p.smoker} onClick={() => set({ smoker: true })} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">How steady is your income?</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Choice label="Steady" selected={p.incomeStability === "stable"} onClick={() => set({ incomeStability: "stable" })} />
                  <Choice label="Varies" selected={p.incomeStability === "variable"} onClick={() => set({ incomeStability: "variable" })} />
                  <Choice label="Hard to say" selected={p.incomeStability === "uncertain"} onClick={() => set({ incomeStability: "uncertain" })} />
                </div>
              </div>
              <Nav onNext={next} onBack={() => setStage("welcome")} />
            </Card>
          )}

          {stage === "family" && (
            <Card title="Who counts on your income?">
              <div className="grid grid-cols-2 gap-2">
                <Choice label="I have a partner" selected={p.hasPartner} onClick={() => set({ hasPartner: true })} />
                <Choice label="It's just me" selected={!p.hasPartner} onClick={() => set({ hasPartner: false, partnerIncome: 0 })} />
              </div>
              {p.hasPartner && (
                <NumberField label="What your partner earns" value={p.partnerIncome} onChange={(v) => set({ partnerIncome: v })} prefix="$" />
              )}
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Children at home" value={p.numChildren} onChange={(v) => set({ numChildren: Math.max(0, v) })} />
                {p.numChildren > 0 && (
                  <NumberField label="Youngest is" value={p.youngestChildAge} onChange={(v) => set({ youngestChildAge: Math.max(0, v) })} />
                )}
              </div>
              <NumberField label="Age you'd like to retire" value={p.retirementAge} onChange={(v) => set({ retirementAge: Math.max(50, Math.min(75, v)) })} />
              <Nav onNext={next} onBack={back} />
            </Card>
          )}

          {stage === "assets" && (
            <Card title="What you own" sub="Rough numbers are fine — we're sizing a gap, not filing taxes.">
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Your home is worth" value={p.homeValue} onChange={(v) => set({ homeValue: v })} prefix="$" />
                <NumberField label="401(k) / IRA" value={p.retirementAccounts} onChange={(v) => set({ retirementAccounts: v })} prefix="$" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Savings & investments" value={p.savingsAndInvestments} onChange={(v) => set({ savingsAndInvestments: v })} prefix="$" />
                <NumberField label="Anything else" value={p.otherAssets} onChange={(v) => set({ otherAssets: v })} prefix="$" />
              </div>
              <Note>
                We won't count your home toward protecting your family. They have to live somewhere,
                and having to sell it is exactly what we're trying to prevent.
              </Note>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Getting your full employer 401(k) match?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Choice label="Yes" selected={p.employerMatchCaptured} onClick={() => set({ employerMatchCaptured: true })} />
                  <Choice label="No / not offered" selected={!p.employerMatchCaptured} onClick={() => set({ employerMatchCaptured: false })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Maxing out your 401(k) and IRA each year?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Choice label="Yes, both full" selected={p.maxedTaxAdvantaged} onClick={() => set({ maxedTaxAdvantaged: true })} />
                  <Choice label="Not yet" selected={!p.maxedTaxAdvantaged} onClick={() => set({ maxedTaxAdvantaged: false })} />
                </div>
              </div>
              <Nav onNext={next} onBack={back} />
            </Card>
          )}

          {stage === "debts" && (
            <Card title="What you owe">
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Mortgage left" value={p.mortgageBalance} onChange={(v) => set({ mortgageBalance: v })} prefix="$" />
                <NumberField label="Other debts" value={p.otherDebts} onChange={(v) => set({ otherDebts: v })} prefix="$" />
              </div>
              <NumberField label="Life cover you already have" value={p.existingLifeCoverage} onChange={(v) => set({ existingLifeCoverage: v })} prefix="$" />
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Any of that at credit-card interest rates?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Choice label="No" selected={!p.highInterestDebt} onClick={() => set({ highInterestDebt: false })} />
                  <Choice label="Yes, some" selected={p.highInterestDebt} onClick={() => set({ highInterestDebt: true })} />
                </div>
              </div>
              <Nav onNext={next} onBack={back} nextLabel="Show me my plan" />
            </Card>
          )}

          {stage === "plan" && (
            <Card
              title={analysis.gap > 0 ? `You're short ${fmtUsd(analysis.gap)}` : "You're already covered"}
              sub="Everything on the right comes from the numbers you just gave us."
            >
              {analysis.reasons.map((r) => (
                <p key={r} className="text-sm leading-relaxed text-slate-600">{r}</p>
              ))}

              {analysis.recommendedPermanentFace > 0 && verdict.status !== "not_yet" && (
                <Note>
                  The next few screens are about that permanent {fmtUsd(analysis.recommendedPermanentFace)} —
                  what it costs, what it builds, and what you can do with the money along the way.
                  You choose how much to put in.
                </Note>
              )}

              {verdict.status === "not_yet" && (
                <Note tone="amber">
                  You can still look at how this works, but based on your answers it isn't the right
                  next step yet. We'd rather tell you that now.
                </Note>
              )}

              <Nav
                onNext={next}
                onBack={back}
                nextLabel={
                  analysis.recommendedPermanentFace > 0
                    ? "See what the permanent part does"
                    : "Show me how it works anyway"
                }
              />
            </Card>
          )}

          {stage === "amount" && (
            <Card
              title="How much would you put in each month?"
              sub={`We've sized the permanent part at ${fmtUsd(analysis.recommendedPermanentFace)}. You decide how hard to fund it.`}
            >
              <Range
                label="Every month"
                value={p.monthlyBudget} min={100} max={5000} step={50}
                format={(v) => `$${v.toLocaleString()}`} onChange={(v) => set({ monthlyBudget: v })}
                hint={
                  verdict.suggestedMonthlyHigh > 0
                    ? `For this amount of cover, ${fmtUsdExact(verdict.suggestedMonthlyLow)}–${fmtUsdExact(verdict.suggestedMonthlyHigh)} a month is the usual range`
                    : `That's ${((p.monthlyBudget * 12) / Math.max(1, p.annualIncome) * 100).toFixed(1)}% of your income`
                }
              />

              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">
                    {fmtUsd(analysis.recommendedTermFace)} term costs
                  </div>
                  <div className="text-lg font-bold text-slate-700">
                    {fmtUsdExact(termPremium)}<span className="text-xs font-normal text-slate-400">/mo</span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">The rest builds up</div>
                  <div className="text-lg font-bold text-teal-600">
                    {fmtUsdExact(projection.meta.monthlyIntoVehicle)}<span className="text-xs font-normal text-slate-400">/mo</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Could you keep this up even in a lean year?
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Choice label="Yes, comfortably" selected={p.canSustainIncomeDrop} onClick={() => set({ canSustainIncomeDrop: true })} />
                  <Choice label="It'd be tight" selected={!p.canSustainIncomeDrop} onClick={() => set({ canSustainIncomeDrop: false })} />
                </div>
                {!p.canSustainIncomeDrop && p.monthlyBudget > 200 && (
                  <Note tone="amber">
                    Then let's size it to a comfortable number instead — this works best when you never
                    have to stop.{" "}
                    <button
                      className="font-semibold underline"
                      onClick={() => set({ monthlyBudget: Math.max(150, Math.round((p.monthlyBudget * 0.7) / 50) * 50) })}
                    >
                      Try {fmtUsdExact(Math.max(150, Math.round((p.monthlyBudget * 0.7) / 50) * 50))}/mo
                    </button>
                  </Note>
                )}
              </div>
              <Nav onNext={next} onBack={back} nextLabel="See how it grows" />
            </Card>
          )}

          {stage === "grow" && (
            <Card title="What happens over the years">
              <Note>
                The balance on the right grows two ways: what you add each month, and what it earns.
                Drag the age slider on the right to jump forward in time.
              </Note>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Which years would you like to see it through?</Label>
                <p className="text-xs leading-relaxed text-slate-500">
                  Try a few. You may be surprised that a bad start often ends up ahead — while you're
                  still paying in, a flat year costs you very little because the balance is small, and
                  the strong years that follow land on a much bigger one.
                </p>
                {HISTORY_PRESETS.map((h) => (
                  <Choice
                    key={h.start}
                    label={h.label}
                    description={h.sub}
                    selected={p.windowStart === h.start}
                    onClick={() => set({ windowStart: h.start })}
                  />
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 text-sm font-semibold text-slate-900">What about a crash?</div>
                <p className="mb-3 text-sm leading-relaxed text-slate-600">
                  This is the part most people haven't seen before. In a year the market drops 38%,
                  your balance doesn't drop with it — you simply earn nothing that year and carry on
                  from where you were.
                </p>
                <Button
                  variant={crashDemo ? "default" : "outline"}
                  onClick={() => setCrashDemo((c) => !c)}
                  className={crashDemo ? "w-full bg-teal-600 hover:bg-teal-700" : "w-full"}
                >
                  {crashDemo ? "Crash applied — see the numbers" : "Crash the market and show me"}
                </Button>
                {crashDemo && (
                  <p className="mt-3 text-sm leading-relaxed text-teal-800">
                    The market fell 38.5% at age {p.age + 5}. Your balance earned <strong>0%</strong> —
                    it didn't go backwards. That's the difference that matters most over a lifetime,
                    because losses are much harder to recover from than gains are to make.
                  </p>
                )}
              </div>
              <AskButton onClick={() => flagQuestion("Wants to understand the growth and the cap better")} flagged={questions.includes("Wants to understand the growth and the cap better")} />
              <Nav onNext={next} onBack={back} />
            </Card>
          )}

          {stage === "access" && (
            <Card title="Getting to the money later">
              <Note>
                Once it's built up, you can borrow against it — and money you borrow isn't taxed.
                There's no age limit, no paperwork, and nothing has to be sold.
              </Note>
              <Range
                label="Income you'd like each year"
                value={p.annualIncomeTarget} min={0} max={150_000} step={5_000}
                format={fmtUsd} onChange={(v) => set({ annualIncomeTarget: v })}
              />
              <Range
                label="Starting at age"
                value={p.incomeStartAge}
                min={Math.max(50, p.age + 10)}
                max={Math.max(Math.max(50, p.age + 10) + 5, 80)}
                step={1}
                format={(v) => `${v}`} onChange={(v) => set({ incomeStartAge: v })}
              />
              {projection.meta.iulLapseAge ? (
                <Note tone="amber">
                  That's more than this can support — at this rate the money would run out around age{" "}
                  {projection.meta.iulLapseAge}, and the protection would end with it. Bring the yearly
                  amount down until this message clears.
                </Note>
              ) : (
                <Note>
                  Comfortable at this level — it keeps paying and the protection stays in place.
                </Note>
              )}
              <AskButton onClick={() => flagQuestion("Wants detail on how borrowing works")} flagged={questions.includes("Wants detail on how borrowing works")} />
              <Nav onNext={next} onBack={back} />
            </Card>
          )}

          {stage === "life" && (
            <Card title="What if life doesn't go to plan?">
              <div className="space-y-2">
                {SCENARIO_DECK.map((card) => {
                  const active = card.id in scenarios;
                  const at = scenarios[card.id] ?? p.age + card.defaultAgeOffset;
                  return (
                    <div key={card.id} className={`rounded-xl border-2 transition-all ${active ? "border-teal-500 bg-teal-50/50" : "border-slate-200 bg-white"}`}>
                      <button
                        className="flex w-full items-start gap-3 p-3.5 text-left"
                        onClick={() =>
                          setScenarios((prev) => {
                            const copy = { ...prev };
                            if (card.id in copy) delete copy[card.id];
                            else copy[card.id] = p.age + card.defaultAgeOffset;
                            return copy;
                          })
                        }
                      >
                        <span className={`mt-0.5 rounded-lg p-1.5 ${active ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"}`}>
                          {SCENARIO_ICONS[card.icon]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-900">{card.label}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">{card.blurb}</span>
                        </span>
                        {active && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-500" />}
                      </button>
                      {active && (
                        <div className="space-y-3 border-t border-teal-200 p-3.5">
                          <Range
                            label="If it happened at age"
                            value={at}
                            min={p.age + card.minAgeOffset}
                            max={Math.min(94, p.age + card.maxAgeOffset)}
                            step={1}
                            format={(v) => `${v}`}
                            onChange={(v) => setScenarios((prev) => ({ ...prev, [card.id]: v }))}
                          />
                          <p className="text-sm leading-relaxed text-slate-700">{card.whatHappens}</p>
                          <details className="text-xs">
                            <summary className="cursor-pointer text-slate-400 hover:text-slate-600">Worth knowing</summary>
                            <p className="mt-1.5 leading-relaxed text-slate-500">{card.worthKnowing}</p>
                          </details>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <Nav onNext={next} onBack={back} />
            </Card>
          )}

          {stage === "summary" && (
            <Card title="Here's where you landed">
              {verdict.status === "not_yet" ? (
                <>
                  <Note tone="amber">
                    Based on your answers, there are a couple of things worth sorting out before a plan
                    like this makes sense for you. It's built for the long term, so it works best once
                    the basics are covered.
                  </Note>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 text-sm font-semibold text-slate-900">Worth doing first</div>
                    <ul className="space-y-1.5">
                      {verdict.insteadDoThis.map((s: string) => (
                        <li key={s} className="flex gap-2 text-sm text-slate-600">
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <Note>
                  This looks like a good fit. At {fmtUsdExact(p.monthlyBudget)} a month, you'd have around{" "}
                  <strong>{fmtUsdExact(at65?.netCashValue ?? 0)}</strong> built up by 65, with{" "}
                  <strong>{fmtUsd(projection.meta.iulFace)}</strong> protecting your family the whole way
                  — and you can reach the money tax-free whenever you need it.
                </Note>
              )}

              {questions.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 text-sm font-semibold text-slate-900">Your questions</div>
                  <ul className="space-y-1 text-xs text-slate-500">
                    {questions.map((q) => <li key={q}>• {q}</li>)}
                  </ul>
                  <p className="mt-2 text-xs text-slate-400">We'll cover these when we speak.</p>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-1 text-sm font-semibold text-slate-900">Want these numbers sent to you?</div>
                <p className="mb-3 text-xs leading-relaxed text-slate-500">
                  Leave it blank and nothing is stored.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="First name" value={p.firstName} onChange={(e) => set({ firstName: e.target.value })} />
                  <Input placeholder="Last name" value={p.lastName} onChange={(e) => set({ lastName: e.target.value })} />
                </div>
                <div className="mt-2 grid gap-2">
                  <Input type="email" placeholder="Email" value={p.email} onChange={(e) => set({ email: e.target.value })} />
                  <Input type="tel" placeholder="Phone (optional)" value={p.phone} onChange={(e) => set({ phone: e.target.value })} />
                </div>
                <Button
                  onClick={submit}
                  disabled={submitting || (!p.firstName && !p.email)}
                  className="mt-3 w-full bg-teal-600 hover:bg-teal-700"
                >
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending</> : "Send me my numbers"}
                </Button>
              </div>
              <Button variant="ghost" onClick={back} className="w-full text-slate-500">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go back
              </Button>
            </Card>
          )}

          {stage === "done" && (
            <Card title={submitted ? "On its way." : "That's everything."}>
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                <CheckCircle2 className="mb-2 h-6 w-6 text-teal-600" />
                <p className="text-sm leading-relaxed text-teal-900">
                  {submitted
                    ? "We'll be in touch shortly with your numbers. Whoever calls will already have everything you built here, so you won't have to start over."
                    : "Nothing was saved. Come back any time."}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStage("amount")} className="flex-1">Change my numbers</Button>
                <Button variant="outline" onClick={() => navigate("/retirement-calculator")} className="flex-1">Protection only</Button>
              </div>
            </Card>
          )}

          <p className="px-1 text-[11px] leading-relaxed text-slate-400">
            An estimate for learning purposes — not a policy illustration, not a specific product, and not a
            recommendation to buy. Growth uses real S&amp;P 500 history; costs are typical industry figures.
            Growth caps are not guaranteed and can be changed by the insurer.
          </p>
        </div>

        {/* ── Right: nothing until the risk has actually been worked out ── */}
        {!discovery && (
        <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)]">
          {stage === "plan" ? (
            <PlanPanel analysis={analysis} verdict={verdict} />
          ) : (
          <ResultsPanel
            projection={projection}
            risk={risk}
            age={p.age}
            atAge={atAge}
            onAtAgeChange={setAtAge}
            termFace={analysis.recommendedTermFace}
            termYears={analysis.recommendedTermYears}
            fundingYears={input.fundingYears}
            incomeStartAge={p.incomeStartAge}
            annualIncomeTarget={p.annualIncomeTarget}
            chartView={STAGE_CHART[stage]}
            eventAges={eventAges}
            headline={STAGE_HEADLINE[stage]}
          />
          )}
        </div>
        )}
      </main>

      {explainOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/30 p-4 sm:items-center" onClick={() => setExplainOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">{STAGE_TITLE[stage]}, in plain words</h3>
              <button onClick={() => setExplainOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {explaining ? (
              <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> One moment…
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {explainText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-bold leading-tight text-slate-900">{title}</h2>
        {sub && <p className="mt-1 text-sm leading-relaxed text-slate-500">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Nav({ onNext, onBack, nextLabel }: { onNext: () => void; onBack: () => void; nextLabel?: string }) {
  return (
    <div className="flex gap-2 pt-1">
      <Button variant="outline" onClick={onBack} className="px-3">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button onClick={onNext} className="flex-1 bg-teal-600 hover:bg-teal-700">
        {nextLabel ?? "Continue"} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function AskButton({ onClick, flagged }: { onClick: () => void; flagged: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-medium transition-all ${
        flagged
          ? "border-teal-300 bg-teal-50 text-teal-800"
          : "border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700"
      }`}
    >
      <HelpCircle className="h-3.5 w-3.5" />
      {flagged ? "Noted — we'll cover this when we speak" : "I have a question about this"}
    </button>
  );
}
