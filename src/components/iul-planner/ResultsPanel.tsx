import { useState } from "react";
import { BarChart3, ChevronDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Canvas, { type CanvasView } from "@/components/iul-planner/Canvas";
import { BenefitsList } from "@/components/iul-planner/BenefitsPanel";
import {
  type DualProjection,
  type RiskPoint,
  fmtUsd,
  fmtUsdExact,
} from "@/lib/iul-planner/engine";

/**
 * The right-hand panel. Numbers first, large and legible, updating on every
 * change the client makes on the left. Charts and the cost breakdown are both
 * one click away — present, but not competing with the headline answer.
 */

interface ResultsPanelProps {
  projection: DualProjection;
  risk: RiskPoint[];
  age: number;
  atAge: number;
  onAtAgeChange: (age: number) => void;
  termFace: number;
  termYears: number;
  fundingYears: number;
  incomeStartAge: number;
  annualIncomeTarget: number;
  chartView: CanvasView;
  eventAges?: Array<{ age: number; label: string }>;
  /** Headline copy changes with the stage so the panel answers the live question. */
  headline?: string;
}

function BigNumber({
  label, value, sub, tone = "slate",
}: {
  label: string; value: string; sub?: string; tone?: "teal" | "slate" | "amber";
}) {
  const tones = {
    teal: "border-teal-200 bg-teal-50",
    slate: "border-slate-200 bg-white",
    amber: "border-amber-200 bg-amber-50",
  }[tone];
  const valueTone = {
    teal: "text-teal-700",
    slate: "text-slate-900",
    amber: "text-amber-700",
  }[tone];
  return (
    <div className={`rounded-2xl border p-4 ${tones}`}>
      <div className="text-xs font-medium leading-snug text-slate-500">{label}</div>
      <div className={`mt-1.5 text-3xl font-bold leading-none tracking-tight ${valueTone}`}>{value}</div>
      {sub && <div className="mt-1.5 text-xs leading-snug text-slate-500">{sub}</div>}
    </div>
  );
}

function Disclosure({
  label, icon, children, defaultOpen = false,
}: {
  label: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <span className="text-slate-400">{icon}</span>
        {label}
        <ChevronDown className={`ml-auto h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-slate-100 p-4">{children}</div>}
    </div>
  );
}

export default function ResultsPanel({
  projection, risk, age, atAge, onAtAgeChange,
  termFace, termYears, fundingYears, incomeStartAge, annualIncomeTarget,
  chartView, eventAges, headline,
}: ResultsPanelProps) {
  const [showChart, setShowChart] = useState(false);

  const row = projection.iul.find((y) => y.age === atAge) ?? projection.iul[projection.iul.length - 1];
  const yearsIn = Math.max(0, atAge - age);
  const putIn = row?.cumulativePremium ?? 0;
  const worth = row?.netCashValue ?? 0;
  const gain = worth - putIn;
  const familyGets = row?.payoutOnDeath ?? 0;

  // Sustainable tax-free income, taken from the engine's own income run.
  const incomeYears = projection.iul.filter((y) => y.distribution > 0);
  const yearlyIncome = incomeYears.length > 0 ? annualIncomeTarget : 0;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      {headline && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm leading-relaxed text-slate-600">{headline}</p>
        </div>
      )}

      {/* ── Age selector: the question they actually care about ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-slate-700">Show me at age</span>
          <span className="text-2xl font-bold text-slate-900">{atAge}</span>
        </div>
        <input
          type="range"
          min={age + 1}
          max={90}
          step={1}
          value={atAge}
          onChange={(e) => onAtAgeChange(Number(e.target.value))}
          className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600"
        />
        <div className="mt-1 flex justify-between text-[11px] text-slate-400">
          <span>{yearsIn} years from now</span>
          <span>age 90</span>
        </div>
      </div>

      {/* ── The four numbers ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <BigNumber
          label="What you'll have put in"
          value={fmtUsdExact(putIn)}
          sub={`${fmtUsdExact(projection.meta.monthlyIntoVehicle)} a month`}
        />
        <BigNumber
          label={`What it could be worth at ${atAge}`}
          value={fmtUsdExact(worth)}
          sub={gain > 0 ? `${fmtUsdExact(gain)} more than you put in` : "still building — early years grow slowly"}
          tone="teal"
        />
        <BigNumber
          label="Your family is protected for"
          value={fmtUsd(familyGets)}
          sub="paid tax-free, from day one"
        />
        <BigNumber
          label={yearlyIncome > 0 ? `Tax-free income from ${incomeStartAge}` : "Tax-free income later"}
          value={yearlyIncome > 0 ? `${fmtUsdExact(yearlyIncome)}/yr` : "set this below"}
          sub={yearlyIncome > 0 ? "you don't pay tax on money you borrow back" : undefined}
          tone="teal"
        />
      </div>

      {/* ── The reasons stay on screen, under the numbers ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-slate-900">What this does for you</div>
        <BenefitsList />
      </div>

      {/* ── Everything else, one click away ── */}
      <div className="space-y-2">
        <Button
          variant="outline"
          onClick={() => setShowChart((s) => !s)}
          className="w-full justify-start gap-2 text-sm text-slate-600"
        >
          <BarChart3 className="h-4 w-4 text-slate-400" />
          {showChart ? "Hide the chart" : "Show me this as a chart"}
        </Button>

        {showChart && (
          <div className="h-80 rounded-2xl">
            <Canvas
              view={chartView}
              projection={projection}
              risk={risk}
              age={age}
              termYears={termYears}
              termFace={termFace}
              fundingYears={fundingYears}
              incomeStartAge={incomeStartAge}
              focusAge={atAge}
              eventAges={eventAges}
            />
          </div>
        )}

        <Disclosure label="What does it cost?" icon={<Info className="h-4 w-4" />}>
          <div className="space-y-3 text-sm text-slate-600">
            <p className="leading-relaxed">
              Part of each payment covers the protection — that's what makes the{" "}
              {fmtUsd(familyGets)} to your family possible from day one, and it's why this isn't
              simply a savings account.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Cost by age {atAge}</div>
                <div className="mt-0.5 text-lg font-bold text-slate-900">
                  {fmtUsdExact(
                    projection.iul
                      .filter((y) => y.age <= atAge)
                      .reduce((s, y) => s + y.totalCharges, 0),
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Your money passes what you paid</div>
                <div className="mt-0.5 text-lg font-bold text-slate-900">
                  {projection.meta.breakEvenYear
                    ? `Year ${projection.meta.breakEvenYear}`
                    : "Not at this level"}
                </div>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Costs are highest in the early years and shrink as a share of your balance every year
              after. Before roughly year {projection.meta.breakEvenYear ?? "—"}, taking the money out
              would give you back less than you put in — which is why this only makes sense as a
              long-term plan.
            </p>
          </div>
        </Disclosure>

        <Disclosure label="What am I assuming here?" icon={<Info className="h-4 w-4" />}>
          <div className="space-y-2 text-xs leading-relaxed text-slate-500">
            <p>
              Growth is based on real S&amp;P 500 returns from {projection.iul[0]?.calendarYear} onward,
              with a 0% floor in down years and a cap on the up years.
            </p>
            <p>
              <strong className="text-slate-700">The cap isn't guaranteed.</strong> Insurers can lower
              it — across the industry caps fell from 12–13% in 2019 to 8–9% by 2026. Future results
              will differ from anything shown here.
            </p>
            <p>
              This is an educational estimate, not a policy illustration and not a recommendation to
              buy. A real illustration from a specific insurer will look different.
            </p>
          </div>
        </Disclosure>
      </div>
    </div>
  );
}
