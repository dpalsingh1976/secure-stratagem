import { useMemo } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type DualProjection,
  type RiskPoint,
  fmtUsd,
  fmtUsdExact,
} from "@/lib/iul-planner/engine";

export type CanvasView =
  | "life"
  | "hump"
  | "allocation"
  | "floor"
  | "growth"
  | "access"
  | "scenarios"
  | "verdict";

const IUL_COLOR = "#0d9488";
const ALT_COLOR = "#f59e0b";
const LOSS_COLOR = "#dc2626";
const GRID = "#e2e8f0";

interface CanvasProps {
  view: CanvasView;
  projection: DualProjection;
  risk: RiskPoint[];
  age: number;
  termYears: number;
  termFace: number;
  fundingYears: number;
  incomeStartAge: number;
  /** Highlighted age, driven by the scrubber. */
  focusAge?: number;
  eventAges?: Array<{ age: number; label: string }>;
}

function axisMoney(v: number) {
  return fmtUsd(v);
}

function ChartFrame({
  title,
  subtitle,
  children,
  footnote,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footnote?: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
      {footnote && <p className="mt-3 text-[11px] leading-relaxed text-slate-400">{footnote}</p>}
    </div>
  );
}

function MoneyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <div className="mb-1 text-xs font-semibold text-slate-900">Age {label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}</span>
          <span className="ml-auto font-semibold text-slate-900">
            {typeof p.value === "number" && Math.abs(p.value) > 100
              ? fmtUsdExact(p.value)
              : `${Number(p.value).toFixed(1)}%`}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Views ────────────────────────────────────────────────────────────────────

function LifeView({ age, risk, termYears }: { age: number; risk: RiskPoint[]; termYears: number }) {
  const end = 95;
  const span = end - age;
  const pct = (a: number) => ((a - age) / span) * 100;

  const milestones = useMemo(() => {
    const m: Array<{ age: number; label: string; tone: string }> = [
      { age, label: "Today", tone: "bg-slate-900" },
      { age: age + termYears, label: "Term ends", tone: "bg-amber-500" },
      { age: 65, label: "Retirement", tone: "bg-teal-600" },
      { age: 95, label: "Age 95", tone: "bg-slate-300" },
    ];
    return m.filter((x) => x.age >= age && x.age <= end).sort((a, b) => a.age - b.age);
  }, [age, termYears]);

  return (
    <ChartFrame
      title="Your life, drawn out"
      subtitle="Everything that follows sits on this line."
      footnote="Nothing here is a product yet. This is just the shape of the years you are planning for."
    >
      <div className="flex h-full flex-col justify-center">
        <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-teal-500 via-teal-300 to-slate-200">
          {milestones.map((m) => (
            <div
              key={m.label}
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${Math.min(99, Math.max(0, pct(m.age)))}%` }}
            >
              <div className={`h-4 w-4 -translate-x-1/2 rounded-full ring-4 ring-white ${m.tone}`} />
            </div>
          ))}
        </div>
        <div className="relative mt-4 h-24">
          {milestones.map((m, i) => (
            <div
              key={m.label}
              className="absolute w-24 -translate-x-1/2 text-center"
              style={{
                left: `${Math.min(96, Math.max(4, pct(m.age)))}%`,
                top: i % 2 === 0 ? 0 : 44,
              }}
            >
              <div className="text-xs font-semibold text-slate-800">{m.label}</div>
              <div className="text-[11px] text-slate-400">age {m.age}</div>
            </div>
          ))}
        </div>
        {risk.length > 0 && (
          <div className="mt-2 rounded-xl bg-slate-50 p-4 text-center">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Protection your family needs today
            </div>
            <div className="mt-1 text-3xl font-bold text-slate-900">{fmtUsd(risk[0].need)}</div>
          </div>
        )}
      </div>
    </ChartFrame>
  );
}

function HumpView({ risk, age, termYears, termFace }: { risk: RiskPoint[]; age: number; termYears: number; termFace: number }) {
  const data = risk.map((p) => ({
    age: p.age,
    need: Math.round(p.need),
    term: p.age < age + termYears ? termFace : 0,
  }));

  return (
    <ChartFrame
      title="The shape of your risk"
      subtitle="High while there is a mortgage, children at home and earning years ahead — then it fades."
      footnote="Term insurance is priced to cover this hump. That is why it is cheap, and it is also why it ends."
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={axisMoney} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<MoneyTooltip />} />
          <Area
            type="monotone"
            dataKey="need"
            name="Protection need"
            stroke={IUL_COLOR}
            fill={IUL_COLOR}
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Area
            type="stepAfter"
            dataKey="term"
            name="Term coverage"
            stroke={ALT_COLOR}
            fill={ALT_COLOR}
            fillOpacity={0.08}
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          <ReferenceLine
            x={age + termYears}
            stroke={ALT_COLOR}
            strokeDasharray="3 3"
            label={{ value: "term ends", position: "top", fontSize: 10, fill: ALT_COLOR }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function AllocationView({ projection, age }: { projection: DualProjection; age: number }) {
  const { meta } = projection;
  const total = meta.termMonthlyPremium + meta.monthlyIntoVehicle;
  const termPct = total > 0 ? (meta.termMonthlyPremium / total) * 100 : 0;

  const preview = projection.iul.slice(0, 26).map((y, i) => ({
    age: y.age,
    cash: Math.round(y.netCashValue),
    paid: Math.round(y.cumulativePremium),
    alt: Math.round(projection.brokerage[i]?.balance ?? 0),
  }));

  return (
    <ChartFrame
      title="Where every dollar goes"
      subtitle="Both plans buy the identical term policy. Only the leftover is treated differently."
      footnote={
        meta.isMec
          ? "⚠ At this death benefit the policy becomes a MEC and loses tax-free loan treatment. Raise the face amount."
          : `Minimum death benefit to stay outside MEC at your age and premium: ${fmtUsdExact(meta.minNonMecFace)}.`
      }
    >
      <div className="flex h-full flex-col gap-4">
        <div>
          <div className="flex h-9 w-full overflow-hidden rounded-lg">
            <div
              className="flex items-center justify-center bg-amber-400 text-[11px] font-semibold text-amber-950"
              style={{ width: `${Math.max(termPct, 8)}%` }}
            >
              term
            </div>
            <div className="flex flex-1 items-center justify-center bg-teal-600 text-[11px] font-semibold text-white">
              into the vehicle
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>{fmtUsdExact(meta.termMonthlyPremium)}/mo protection</span>
            <span>{fmtUsdExact(meta.monthlyIntoVehicle)}/mo saved</span>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={preview} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={axisMoney} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={48} />
              <Tooltip content={<MoneyTooltip />} />
              <Line type="monotone" dataKey="paid" name="Total paid in" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              <Area type="monotone" dataKey="cash" name="Policy cash value" stroke={IUL_COLOR} fill={IUL_COLOR} fillOpacity={0.15} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="alt" name="Brokerage" stroke={ALT_COLOR} strokeWidth={2} dot={false} />
              {projection.meta.breakEvenYear && (
                <ReferenceLine
                  x={age + projection.meta.breakEvenYear - 1}
                  stroke={IUL_COLOR}
                  strokeDasharray="3 3"
                  label={{ value: "break-even", position: "insideTopLeft", fontSize: 10, fill: IUL_COLOR }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartFrame>
  );
}

function FloorView({ projection }: { projection: DualProjection }) {
  const data = projection.iul.slice(0, 30).map((y) => ({
    age: y.age,
    index: Number(y.indexReturn.toFixed(1)),
    credited: Number(y.creditedRate.toFixed(1)),
    givenUp: Number(Math.max(0, y.indexReturn - y.creditedRate).toFixed(1)),
    saved: Number(Math.max(0, y.creditedRate - y.indexReturn).toFixed(1)),
  }));

  const totalSaved = data.reduce((s, d) => s + d.saved, 0);
  const totalGivenUp = data.reduce((s, d) => s + d.givenUp, 0);

  return (
    <ChartFrame
      title="What the floor catches, and what the cap costs"
      subtitle="Grey bars are what the index actually did. Teal is what you would have been credited."
      footnote="Real S&P 500 price returns. The floor and the cap are two sides of one trade — you cannot have one without the other."
    >
      <div className="flex h-full flex-col gap-3">
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<MoneyTooltip />} />
              <ReferenceLine y={0} stroke="#475569" />
              <Bar dataKey="index" name="Index" fill="#cbd5e1" radius={[2, 2, 0, 0]} />
              <Line type="stepAfter" dataKey="credited" name="Credited to you" stroke={IUL_COLOR} strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
            <div className="text-[11px] uppercase tracking-wide text-teal-700">Losses the floor absorbed</div>
            <div className="text-xl font-bold text-teal-800">{totalSaved.toFixed(0)} pts</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="text-[11px] uppercase tracking-wide text-amber-700">Gains the cap took</div>
            <div className="text-xl font-bold text-amber-800">{totalGivenUp.toFixed(0)} pts</div>
          </div>
        </div>
      </div>
    </ChartFrame>
  );
}

function GrowthView({ projection, focusAge, fundingYears, age }: { projection: DualProjection; focusAge?: number; fundingYears: number; age: number }) {
  const data = projection.iul.map((y, i) => ({
    age: y.age,
    cash: Math.round(y.netCashValue),
    paid: Math.round(y.cumulativePremium),
    alt: Math.round(projection.brokerage[i]?.balance ?? 0),
    drag: Number(Math.min(60, y.chargeDragPct).toFixed(1)),
  }));

  const focus = focusAge ? data.find((d) => d.age === focusAge) : undefined;

  return (
    <ChartFrame
      title="Twenty years of funding, then the rest of your life"
      subtitle="The red line is what the charges cost you each year, as a share of the account they came from."
      footnote="Charges are front-loaded on purpose — that is what pays for a death benefit that exists from day one. Their bite shrinks every year the account grows."
    >
      <div className="flex h-full flex-col gap-3">
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="money" tickFormatter={axisMoney} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={48} />
              <YAxis yAxisId="pct" orientation="right" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#fca5a5" }} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<MoneyTooltip />} />
              <ReferenceArea yAxisId="money" x1={age} x2={age + fundingYears} fill="#0d9488" fillOpacity={0.04} />
              <Area yAxisId="money" type="monotone" dataKey="cash" name="Policy cash value" stroke={IUL_COLOR} fill={IUL_COLOR} fillOpacity={0.15} strokeWidth={2} dot={false} />
              <Line yAxisId="money" type="monotone" dataKey="alt" name="Brokerage" stroke={ALT_COLOR} strokeWidth={2} dot={false} />
              <Line yAxisId="money" type="monotone" dataKey="paid" name="Total paid in" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              <Line yAxisId="pct" type="monotone" dataKey="drag" name="Charge drag" stroke={LOSS_COLOR} strokeWidth={1.5} strokeOpacity={0.6} dot={false} />
              {projection.meta.breakEvenYear && (
                <ReferenceDot
                  yAxisId="money"
                  x={age + projection.meta.breakEvenYear - 1}
                  y={data[projection.meta.breakEvenYear - 1]?.cash ?? 0}
                  r={5}
                  fill={IUL_COLOR}
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
              {focus && <ReferenceLine yAxisId="money" x={focus.age} stroke="#334155" strokeWidth={1} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {focus && (
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Paid in" value={fmtUsdExact(focus.paid)} tone="slate" />
            <Stat label="Policy cash value" value={fmtUsdExact(focus.cash)} tone="teal" />
            <Stat label="Brokerage" value={fmtUsdExact(focus.alt)} tone="amber" />
          </div>
        )}
      </div>
    </ChartFrame>
  );
}

function AccessView({ projection, incomeStartAge }: { projection: DualProjection; incomeStartAge: number }) {
  const data = projection.iul
    .filter((y) => y.age >= incomeStartAge - 3)
    .map((y) => {
      const b = projection.brokerage.find((x) => x.age === y.age);
      return {
        age: y.age,
        policyIncome: Math.round(y.distribution),
        altIncome: Math.round(b?.distribution ?? 0),
        loan: Math.round(y.loanBalance),
        cash: Math.round(y.netCashValue),
        altBalance: Math.round(b?.balance ?? 0),
      };
    });

  const { meta } = projection;

  return (
    <ChartFrame
      title="Taking the money out"
      subtitle="Same spendable income from both. One is taxed on the way out; the other accrues loan interest instead."
      footnote="A loan is tax-free only while the policy stays in force. Let the loan overtake the cash value and the policy lapses — and the whole gain becomes taxable income in one year."
    >
      <div className="flex h-full flex-col gap-3">
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={axisMoney} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={48} />
              <Tooltip content={<MoneyTooltip />} />
              <Area type="monotone" dataKey="cash" name="Policy cash value" stroke={IUL_COLOR} fill={IUL_COLOR} fillOpacity={0.12} strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="altBalance" name="Brokerage" stroke={ALT_COLOR} fill={ALT_COLOR} fillOpacity={0.08} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="loan" name="Loan balance" stroke={LOSS_COLOR} strokeWidth={2} strokeDasharray="4 3" dot={false} />
              {meta.iulLapseAge && (
                <ReferenceLine x={meta.iulLapseAge} stroke={LOSS_COLOR} label={{ value: "lapse", position: "top", fontSize: 10, fill: LOSS_COLOR }} />
              )}
              {meta.brokerageDepletedAge && (
                <ReferenceLine x={meta.brokerageDepletedAge} stroke={ALT_COLOR} label={{ value: "account empty", position: "top", fontSize: 10, fill: ALT_COLOR }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Tax-free from policy" value={fmtUsd(meta.totalTaxFreeIncome)} tone="teal" />
          <Stat label="After-tax from brokerage" value={fmtUsd(meta.totalBrokerageIncome)} tone="amber" />
          <Stat label="Tax paid on the way" value={fmtUsd(meta.brokerageTaxPaid)} tone="red" />
        </div>
      </div>
    </ChartFrame>
  );
}

function ScenariosView({ projection, eventAges }: { projection: DualProjection; eventAges?: Array<{ age: number; label: string }> }) {
  const data = projection.iul.map((y, i) => ({
    age: y.age,
    cash: Math.round(y.netCashValue),
    death: Math.round(y.payoutOnDeath),
    alt: Math.round(projection.brokerage[i]?.balance ?? 0),
    altDeath: Math.round(projection.brokerage[i]?.payoutOnDeath ?? 0),
  }));

  return (
    <ChartFrame
      title="How this life plays out both ways"
      subtitle="Solid lines are what you can spend. Faint lines are what your family receives if you die that year."
      footnote="Every card you play changes both tracks at once. Nothing is hidden — if a scenario favours the brokerage, you will see it here."
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={axisMoney} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<MoneyTooltip />} />
          <Line type="monotone" dataKey="death" name="Family receives (policy)" stroke={IUL_COLOR} strokeWidth={1} strokeOpacity={0.35} dot={false} />
          <Line type="monotone" dataKey="altDeath" name="Family receives (other plan)" stroke={ALT_COLOR} strokeWidth={1} strokeOpacity={0.35} dot={false} />
          <Area type="monotone" dataKey="cash" name="Policy cash value" stroke={IUL_COLOR} fill={IUL_COLOR} fillOpacity={0.14} strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="alt" name="Brokerage" stroke={ALT_COLOR} strokeWidth={2.5} dot={false} />
          {eventAges?.map((e) => (
            <ReferenceLine
              key={`${e.age}-${e.label}`}
              x={e.age}
              stroke="#475569"
              strokeDasharray="2 3"
              label={{ value: e.label, position: "top", fontSize: 9, fill: "#475569" }}
            />
          ))}
          {projection.meta.iulLapseAge && (
            <ReferenceLine x={projection.meta.iulLapseAge} stroke={LOSS_COLOR} label={{ value: "policy lapses", position: "top", fontSize: 10, fill: LOSS_COLOR }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "teal" | "amber" | "slate" | "red" }) {
  const tones = {
    teal: "border-teal-200 bg-teal-50 text-teal-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    red: "border-red-200 bg-red-50 text-red-700",
  }[tone];
  return (
    <div className={`rounded-xl border p-2.5 ${tones}`}>
      <div className="text-[10px] uppercase leading-tight tracking-wide opacity-70">{label}</div>
      <div className="mt-0.5 text-base font-bold leading-tight">{value}</div>
    </div>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export default function Canvas(props: CanvasProps) {
  const { view, projection, risk, age, termYears, termFace, fundingYears, incomeStartAge, focusAge, eventAges } = props;

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {view === "life" && <LifeView age={age} risk={risk} termYears={termYears} />}
      {view === "hump" && <HumpView risk={risk} age={age} termYears={termYears} termFace={termFace} />}
      {view === "allocation" && <AllocationView projection={projection} age={age} />}
      {view === "floor" && <FloorView projection={projection} />}
      {view === "growth" && <GrowthView projection={projection} focusAge={focusAge} fundingYears={fundingYears} age={age} />}
      {view === "access" && <AccessView projection={projection} incomeStartAge={incomeStartAge} />}
      {(view === "scenarios" || view === "verdict") && <ScenariosView projection={projection} eventAges={eventAges} />}
    </div>
  );
}
