import { ArrowRight, Check, Shield, Sparkles, TrendingUp } from "lucide-react";
import {
  type IulVerdict,
  type NeedsAnalysis,
  fmtUsd,
  fmtUsdExact,
} from "@/lib/iul-planner/engine";

/**
 * The pivot of the whole tool: what the household is short, and how that splits
 * between the cheap temporary cover and the part that never expires. Everything
 * before this screen exists to produce these two numbers; everything after
 * starts from them.
 */

function GapMath({ analysis }: { analysis: NeedsAnalysis }) {
  const rows: Array<[string, number]> = [
    ["Replacing your income", analysis.incomeReplacement],
    ["Clearing the mortgage and debts", analysis.debtPayoff],
    ["Education", analysis.educationFund],
    ["Final expenses", analysis.finalExpenses],
  ].filter(([, v]) => (v as number) > 0) as Array<[string, number]>;

  const available: Array<[string, number]> = [
    ["Retirement accounts (after tax)", analysis.retirementAvailable],
    ["Savings and investments", analysis.liquidAssets],
    ["Life cover you already have", analysis.existingCoverage],
  ].filter(([, v]) => (v as number) > 0) as Array<[string, number]>;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-sm font-semibold text-slate-900">How we got there</div>

      <div className="mt-3 space-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-600">{label}</span>
            <span className="font-medium text-slate-900">{fmtUsdExact(value)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-slate-100 pt-1.5 text-sm">
          <span className="font-semibold text-slate-900">What your family would need</span>
          <span className="font-bold text-slate-900">{fmtUsdExact(analysis.totalNeed)}</span>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {available.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-600">{label}</span>
            <span className="font-medium text-teal-700">−{fmtUsdExact(value)}</span>
          </div>
        ))}
        {available.length === 0 && (
          <div className="text-sm text-slate-500">Nothing available to offset it yet.</div>
        )}
        <div className="flex justify-between border-t border-slate-100 pt-1.5 text-sm">
          <span className="font-semibold text-slate-900">What they could reach today</span>
          <span className="font-bold text-teal-700">{fmtUsdExact(analysis.totalAvailable)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between rounded-xl bg-slate-900 px-4 py-3">
        <span className="text-sm font-medium text-slate-300">Missing</span>
        <span className="text-2xl font-bold text-white">{fmtUsdExact(analysis.gap)}</span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        Your home isn't counted here. Your family has to live somewhere, and having to sell it is
        the outcome this is meant to prevent.
      </p>
    </div>
  );
}

export default function PlanPanel({
  analysis,
  verdict,
}: {
  analysis: NeedsAnalysis;
  verdict: IulVerdict;
}) {
  const covered = analysis.gap <= 0;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      {covered ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
          <Check className="mb-2 h-7 w-7 text-teal-600" />
          <h2 className="text-lg font-bold leading-snug text-teal-900">
            Your family is already covered
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-teal-800">
            What you've built is more than they would need. You don't have a protection gap to fill.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Your protection gap
            </div>
            <div className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
              {fmtUsd(analysis.gap)}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              This is what your family would be short if your income stopped tomorrow.
            </p>
          </div>

          {/* The split — the two numbers this whole flow exists to produce */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
              <div className="mb-2 inline-flex rounded-lg bg-amber-100 p-2 text-amber-700">
                <Shield className="h-4 w-4" />
              </div>
              <div className="text-xs font-medium uppercase tracking-wide text-amber-700">
                Term insurance
              </div>
              <div className="mt-1 text-2xl font-bold text-amber-900">
                {fmtUsd(analysis.recommendedTermFace)}
              </div>
              <div className="mt-0.5 text-sm font-medium text-amber-800">
                for {analysis.recommendedTermYears} years
              </div>
              <p className="mt-2 text-xs leading-relaxed text-amber-800">
                Covers the part that fades — the mortgage gets paid, the children grow up, your
                career finishes. Cheap, because the need is temporary.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-teal-400 bg-teal-50 p-4">
              <div className="mb-2 inline-flex rounded-lg bg-teal-100 p-2 text-teal-700">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-xs font-medium uppercase tracking-wide text-teal-700">
                Permanent cover
              </div>
              <div className="mt-1 text-2xl font-bold text-teal-900">
                {fmtUsd(analysis.recommendedPermanentFace)}
              </div>
              <div className="mt-0.5 text-sm font-medium text-teal-800">that never expires</div>
              <p className="mt-2 text-xs leading-relaxed text-teal-800">
                The part that doesn't go away, which term can't reach because term will have
                expired. This is the piece that also builds money you can use.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Does this actually help you? */}
      <div
        className={`rounded-2xl border-2 p-5 ${
          verdict.status === "good_fit"
            ? "border-teal-300 bg-white"
            : verdict.status === "worth_considering"
              ? "border-slate-300 bg-white"
              : "border-amber-300 bg-amber-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <TrendingUp
            className={`h-5 w-5 ${verdict.status === "not_yet" ? "text-amber-600" : "text-teal-600"}`}
          />
          <h3 className="text-base font-bold text-slate-900">{verdict.headline}</h3>
        </div>

        <ul className="mt-3 space-y-2">
          {verdict.because.map((b) => (
            <li key={b} className="flex gap-2 text-sm leading-relaxed text-slate-600">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
              {b}
            </li>
          ))}
        </ul>

        {verdict.insteadDoThis.length > 0 && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Worth doing first
            </div>
            <ul className="mt-2 space-y-1.5">
              {verdict.insteadDoThis.map((s) => (
                <li key={s} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {!covered && <GapMath analysis={analysis} />}
    </div>
  );
}
