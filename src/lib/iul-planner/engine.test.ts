import { describe, expect, it } from "vitest";
import {
  ALLIANZ_STYLE_CHARGES_UNVERIFIED,
  CHARGE_PRESETS,
  DEFAULT_CREDITING,
  INDUSTRY_TYPICAL_CHARGES,
  calibrate,
  chargeBreakdown,
  perThousandMonthly,
  premiumLoadPct,
  SP500_PRICE_RETURNS,
  corridorFactor,
  defaultInput,
  historicalWindow,
  indexCredit,
  minNonMecFace,
  projectDual,
  riskCurve,
  scoreSuitability,
  surrenderCharge,
  termMonthlyPremium,
} from "./engine";

describe("indexCredit", () => {
  it("floors a losing year at zero instead of passing the loss through", () => {
    expect(indexCredit(-38.5, DEFAULT_CREDITING)).toBe(0);
  });

  it("caps a big up year", () => {
    expect(indexCredit(29.6, DEFAULT_CREDITING)).toBe(9);
  });

  it("passes a middling year through untouched", () => {
    expect(indexCredit(4.5, DEFAULT_CREDITING)).toBeCloseTo(4.5, 10);
  });

  it("applies participation before the cap", () => {
    expect(indexCredit(20, { floor: 0, cap: 12, participation: 50 })).toBe(10);
  });

  it("honours a non-zero floor", () => {
    expect(indexCredit(-20, { floor: 1, cap: 9, participation: 100 })).toBe(1);
  });
});

describe("historicalWindow", () => {
  it("returns real calendar returns in order", () => {
    expect(historicalWindow(2007, 3)).toEqual([
      SP500_PRICE_RETURNS[2007],
      SP500_PRICE_RETURNS[2008],
      SP500_PRICE_RETURNS[2009],
    ]);
  });

  it("wraps past the end of the dataset so every window is the same length", () => {
    const w = historicalWindow(2024, 4);
    expect(w).toHaveLength(4);
    expect(w[0]).toBe(SP500_PRICE_RETURNS[2024]);
    expect(w[2]).toBe(SP500_PRICE_RETURNS[1970]);
  });
});

describe("actuarial tables", () => {
  it("interpolates the 7702 corridor between table ages", () => {
    expect(corridorFactor(40)).toBeCloseTo(2.5, 5);
    expect(corridorFactor(95)).toBeCloseTo(1.0, 5);
    const mid = corridorFactor(42);
    expect(mid).toBeLessThan(2.5);
    expect(mid).toBeGreaterThan(2.15);
  });

  it("requires less face at older ages to stay outside MEC", () => {
    expect(minNonMecFace(30, 10_000)).toBeGreaterThan(minNonMecFace(55, 10_000));
  });

  it("grades the surrender charge to zero", () => {
    expect(surrenderCharge(1, 500_000)).toBeGreaterThan(0);
    expect(surrenderCharge(14, 500_000)).toBe(0);
    expect(surrenderCharge(5, 500_000)).toBeLessThan(surrenderCharge(2, 500_000));
  });

  it("prices term higher for smokers and for longer terms", () => {
    const base = termMonthlyPremium(500_000, 40, 20, "male", false);
    expect(termMonthlyPremium(500_000, 40, 20, "male", true)).toBeGreaterThan(base);
    expect(termMonthlyPremium(500_000, 40, 30, "male", false)).toBeGreaterThan(base);
    expect(termMonthlyPremium(500_000, 40, 20, "female", false)).toBeLessThan(base);
    expect(termMonthlyPremium(0, 40, 20, "male", false)).toBe(0);
  });
});

describe("projectDual", () => {
  const input = defaultInput({ age: 38, monthlyBudget: 1000, windowStart: 1990 });

  it("runs from the starting age to the end age", () => {
    const p = projectDual(input);
    expect(p.iul[0].age).toBe(38);
    expect(p.iul[p.iul.length - 1].age).toBe(95);
    expect(p.brokerage).toHaveLength(p.iul.length);
  });

  it("splits the budget between term and the vehicle, identically in both tracks", () => {
    const p = projectDual(input);
    expect(p.meta.termMonthlyPremium).toBeGreaterThan(0);
    expect(p.meta.monthlyIntoVehicle).toBeCloseTo(1000 - p.meta.termMonthlyPremium, 6);
    const fundingYear = p.iul[3];
    expect(fundingYear.premiumPaid).toBeCloseTo(p.brokerage[3].contribution, 6);
  });

  it("stays outside MEC at the default face and flags it when face is too low", () => {
    expect(projectDual(input).meta.isMec).toBe(false);
    const thin = projectDual({ ...input, iulFace: 50_000 });
    expect(thin.meta.isMec).toBe(true);
  });

  it("never credits a negative rate, even through 2008", () => {
    const crash = projectDual(defaultInput({ age: 38, monthlyBudget: 1000, windowStart: 2000 }));
    expect(Math.min(...crash.iul.map((y) => y.creditedRate))).toBeGreaterThanOrEqual(0);
  });

  it("protects the IUL in a bad decade while the brokerage takes the hit", () => {
    const p = projectDual(defaultInput({
      age: 40, monthlyBudget: 1200, windowStart: 2000, incomeStartAge: 0, fundingYears: 10,
    }));
    const y3 = p.iul[2]; // 2002, index -23.4%
    expect(y3.indexReturn).toBeLessThan(0);
    expect(y3.creditedRate).toBe(0);
    expect(p.brokerage[2].grossReturn).toBeLessThan(0);
  });

  it("charges more in early years than late years, relative to the account", () => {
    const p = projectDual(input);
    expect(p.iul[0].chargeDragPct).toBeGreaterThan(p.iul[15].chargeDragPct);
  });

  it("reaches break-even well after year one but within a working lifetime", () => {
    const p = projectDual(input);
    expect(p.meta.breakEvenYear).not.toBeNull();
    expect(p.meta.breakEvenYear!).toBeGreaterThan(3);
    expect(p.meta.breakEvenYear!).toBeLessThan(25);
  });

  it("keeps a death benefit above the cash value at all times", () => {
    const p = projectDual(input);
    for (const y of p.iul) {
      if (!y.lapsed) expect(y.deathBenefit).toBeGreaterThanOrEqual(y.netCashValue - 1);
    }
  });

  it("accumulates premium into cash value during the funding years", () => {
    const p = projectDual(input);
    expect(p.iul[19].accountValue).toBeGreaterThan(p.iul[4].accountValue);
    expect(p.iul[19].cumulativePremium).toBeGreaterThan(0);
  });
});

describe("life events", () => {
  const base = defaultInput({ age: 40, monthlyBudget: 1200, windowStart: 1995 });

  it("keeps the policy alive through a premium holiday by spending cash value", () => {
    const withHoliday = projectDual({
      ...base,
      events: [{ kind: "premium_holiday", atAge: 45, years: 3 }],
    });
    const duringHoliday = withHoliday.iul.find((y) => y.age === 46)!;
    expect(duringHoliday.premiumPaid).toBe(0);
    expect(duringHoliday.totalCharges).toBeGreaterThan(0);
    expect(duringHoliday.accountValue).toBeGreaterThan(0);
  });

  it("overrides the index return for a market shock year, and the floor absorbs it", () => {
    const shocked = projectDual({
      ...base,
      events: [{ kind: "market_shock", atAge: 50, returnPct: -40 }],
    });
    const year = shocked.iul.find((y) => y.age === 50)!;
    expect(year.indexReturn).toBe(-40);
    expect(year.creditedRate).toBe(0);
    expect(shocked.brokerage.find((y) => y.age === 50)!.grossReturn).toBeLessThan(-30);
  });

  it("reduces the death benefit when the chronic illness rider pays out", () => {
    const ill = projectDual({
      ...base,
      events: [{ kind: "chronic_illness", atAge: 62, accelerateFraction: 0.25 }],
    });
    const before = ill.iul.find((y) => y.age === 61)!;
    const after = ill.iul.find((y) => y.age === 63)!;
    expect(after.deathBenefit).toBeLessThan(before.deathBenefit);
    expect(ill.iul.find((y) => y.age === 62)!.note).toContain("Chronic illness rider");
  });

  it("stops both tracks in the year of death", () => {
    const died = projectDual({ ...base, events: [{ kind: "death", atAge: 58 }] });
    expect(died.iul[died.iul.length - 1].age).toBe(58);
    expect(died.brokerage[died.brokerage.length - 1].age).toBe(58);
  });

  it("pays the family far more on an early death, when the savings account is still small", () => {
    const died = projectDual({ ...base, events: [{ kind: "death", atAge: 50 }] });
    const iul = died.iul[died.iul.length - 1];
    const brokerage = died.brokerage[died.brokerage.length - 1];
    // Both tracks carry the same term, so the gap is the IUL's own death benefit.
    expect(iul.payoutOnDeath).toBeGreaterThan(brokerage.payoutOnDeath);
  });

  it("still pays a death benefit after the term expires, where the brokerage has none", () => {
    const died = projectDual({ ...base, events: [{ kind: "death", atAge: 72 }] });
    const iul = died.iul[died.iul.length - 1];
    const brokerage = died.brokerage[died.brokerage.length - 1];
    expect(brokerage.payoutOnDeath).toBe(brokerage.balance); // the term is long gone
    expect(iul.deathBenefit).toBeGreaterThan(0);
    expect(iul.deathBenefit).toBeGreaterThan(iul.netCashValue);
  });

  it("funds a lump-sum need tax-free from the policy while the brokerage pays tax to raise the same cash", () => {
    const lump = projectDual({
      ...base,
      events: [{ kind: "lump_need", atAge: 55, amount: 40_000 }],
    });
    const year = lump.iul.find((y) => y.age === 55)!;
    expect(year.distribution).toBeGreaterThan(0);
    // Basis comes out first — that part is tax-free and creates no loan.
    expect(year.loanBalance).toBe(0);
    expect(lump.brokerage.find((y) => y.age === 55)!.taxPaid).toBeGreaterThan(0);
  });

  it("switches from withdrawals to loans once basis is exhausted", () => {
    const drawn = projectDual(defaultInput({
      age: 35, monthlyBudget: 1500, fundingYears: 30, incomeStartAge: 65,
      annualIncomeTarget: 35_000, incomeYears: 25, windowStart: 1985,
    }));
    const late = drawn.iul.filter((y) => y.age >= 70 && y.distribution > 0);
    expect(late.some((y) => y.loanBalance > 0)).toBe(true);
  });

  it("pays the accelerated benefit out as tax-free cash", () => {
    const ill = projectDual({
      ...base,
      events: [{ kind: "chronic_illness", atAge: 62, accelerateFraction: 0.25 }],
    });
    const year = ill.iul.find((y) => y.age === 62)!;
    expect(year.acceleratedBenefit).toBeGreaterThan(0);
    expect(year.distribution).toBeGreaterThanOrEqual(year.acceleratedBenefit);
  });
});

describe("the honest counterweight", () => {
  const strongWindow = defaultInput({
    age: 40, monthlyBudget: 1200, fundingYears: 20, incomeStartAge: 0, windowStart: 1995,
  });

  it("lets uncapped investing win outright in a strong market window", () => {
    const p = projectDual(strongWindow);
    const at65 = p.iul.find((y) => y.age === 65)!;
    const b65 = p.brokerage.find((y) => y.age === 65)!;
    expect(b65.balance).toBeGreaterThan(at65.netCashValue);
  });

  it("gives up more to the cap than the floor saves, even across the 2000s", () => {
    // 2000-2024 held three brutal drawdowns AND several 25%+ recovery years.
    // The floor caught the crashes; the cap clipped every recovery. Over a full
    // cycle the cap costs more. Anyone selling IUL on back-tested return alone
    // is selling something this engine will not support.
    const rough = projectDual({ ...strongWindow, windowStart: 2000 });
    const saved = rough.iul
      .filter((y) => y.indexReturn < 0)
      .reduce((sum, y) => sum + (y.creditedRate - y.indexReturn), 0);
    const givenUp = rough.iul
      .filter((y) => y.indexReturn > rough.iul[0].creditedRate)
      .reduce((sum, y) => sum + Math.max(0, y.indexReturn - y.creditedRate), 0);
    expect(givenUp).toBeGreaterThan(saved);
  });

  it("holds cash value flat through a crash while the brokerage draws down hard", () => {
    // This is what the floor actually buys: not more money at the end, but no
    // down years on the way there.
    const rough = projectDual({ ...strongWindow, windowStart: 2000 });
    const funding = (y: { policyYear: number }) => y.policyYear <= 20;

    const iulYears = rough.iul.filter(funding);
    for (let i = 1; i < iulYears.length; i++) {
      expect(iulYears[i].netCashValue).toBeGreaterThanOrEqual(iulYears[i - 1].netCashValue);
    }

    const brk = rough.brokerage.filter(funding);
    const fellInSomeYear = brk.some((y, i) => i > 0 && y.balance < brk[i - 1].balance);
    expect(fellInSomeYear).toBe(true);
  });

  it("keeps the worst peak-to-trough drawdown far smaller than the brokerage's", () => {
    const rough = projectDual({ ...strongWindow, windowStart: 2000 });
    const maxDrawdown = (values: number[]) => {
      let peak = 0;
      let worst = 0;
      for (const v of values) {
        peak = Math.max(peak, v);
        if (peak > 0) worst = Math.max(worst, (peak - v) / peak);
      }
      return worst;
    };
    const iulDd = maxDrawdown(rough.iul.filter((y) => y.policyYear <= 20).map((y) => y.netCashValue));
    const brkDd = maxDrawdown(rough.brokerage.filter((y) => y.policyYear <= 20).map((y) => y.balance));
    expect(brkDd).toBeGreaterThan(0.2);
    expect(iulDd).toBeLessThan(brkDd);
  });

  it("credits zero rather than a loss in every down year of the worst window", () => {
    const rough = projectDual({ ...strongWindow, windowStart: 2000 });
    const downYears = rough.iul.filter((y) => y.indexReturn < 0);
    expect(downYears.length).toBeGreaterThan(3);
    for (const y of downYears) expect(y.creditedRate).toBe(0);
  });
});

describe("income phase", () => {
  it("delivers tax-free distributions from the policy and taxed ones from the brokerage", () => {
    const p = projectDual(defaultInput({
      age: 35, monthlyBudget: 1500, fundingYears: 30, incomeStartAge: 65,
      annualIncomeTarget: 30_000, incomeYears: 20, windowStart: 1985,
    }));
    expect(p.meta.totalTaxFreeIncome).toBeGreaterThan(0);
    expect(p.meta.brokerageTaxPaid).toBeGreaterThan(0);
    const drawYear = p.iul.find((y) => y.age === 70)!;
    expect(drawYear.distribution).toBeGreaterThan(0);
  });

  it("lapses the policy when it is drained faster than it can support", () => {
    const overdrawn = projectDual(defaultInput({
      age: 45, monthlyBudget: 500, fundingYears: 10, incomeStartAge: 60,
      annualIncomeTarget: 90_000, incomeYears: 30, windowStart: 2000,
    }));
    expect(overdrawn.meta.iulLapseAge).not.toBeNull();
    expect(overdrawn.iul.some((y) => y.lapsed)).toBe(true);
  });

  it("runs the brokerage dry when the draw outlasts the balance", () => {
    const drained = projectDual(defaultInput({
      age: 50, monthlyBudget: 600, fundingYears: 10, incomeStartAge: 62,
      annualIncomeTarget: 80_000, incomeYears: 30, windowStart: 2000,
    }));
    expect(drained.meta.brokerageDepletedAge).not.toBeNull();
  });
});

describe("riskCurve", () => {
  const curve = riskCurve({
    age: 35, annualIncome: 120_000, mortgageBalance: 400_000, otherDebts: 30_000,
    numChildren: 2, youngestChildAge: 3, retirementAge: 65, existingCoverage: 0,
  });

  it("starts high and decays to nothing — the shape term is priced for", () => {
    expect(curve[0].need).toBeGreaterThan(1_000_000);
    expect(curve[curve.length - 1].need).toBe(0);
  });

  it("never increases as obligations fall away", () => {
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].need).toBeLessThanOrEqual(curve[i - 1].need + 1);
    }
  });

  it("subtracts coverage already in force", () => {
    const covered = riskCurve({
      age: 35, annualIncome: 120_000, mortgageBalance: 400_000, otherDebts: 30_000,
      numChildren: 2, youngestChildAge: 3, retirementAge: 65, existingCoverage: 500_000,
    });
    expect(covered[0].need).toBeLessThan(curve[0].need);
  });
});

describe("scoreSuitability", () => {
  const solid = {
    age: 42, annualIncome: 250_000, monthlyBudget: 1500, emergencyMonths: 6,
    highInterestDebt: false, employerMatchCaptured: true,
    incomeStability: "stable" as const, horizonYears: 25,
    canSustainIncomeDrop: true, maxedTaxAdvantaged: true,
  };

  it("says yes to the classic case", () => {
    const r = scoreSuitability(solid);
    expect(r.verdict).toBe("good_fit");
    expect(r.score).toBeGreaterThan(70);
  });

  it("refuses when there is no emergency fund", () => {
    const r = scoreSuitability({ ...solid, emergencyMonths: 0 });
    expect(r.verdict).toBe("not_yet");
    expect(r.findings.some((f) => f.id === "emergency_fund" && f.severity === "blocker")).toBe(true);
    expect(r.betterFirstSteps.length).toBeGreaterThan(0);
  });

  it("refuses when high-interest debt or the employer match is outstanding", () => {
    expect(scoreSuitability({ ...solid, highInterestDebt: true }).verdict).toBe("not_yet");
    expect(scoreSuitability({ ...solid, employerMatchCaptured: false }).verdict).toBe("not_yet");
  });

  it("refuses a short horizon", () => {
    const r = scoreSuitability({ ...solid, horizonYears: 6 });
    expect(r.verdict).toBe("not_yet");
    expect(r.findings.some((f) => f.id === "horizon")).toBe(true);
  });

  it("downgrades to conditional on stacked cautions rather than refusing", () => {
    const r = scoreSuitability({
      ...solid, maxedTaxAdvantaged: false, canSustainIncomeDrop: false,
      incomeStability: "variable",
    });
    expect(r.verdict).toBe("conditional");
  });

  it("always explains itself", () => {
    for (const f of scoreSuitability(solid).findings) {
      expect(f.title.length).toBeGreaterThan(0);
      expect(f.detail.length).toBeGreaterThan(20);
    }
  });
});


describe("charge structures", () => {
  it("repeats the last premium-load band for every later year", () => {
    const c = INDUSTRY_TYPICAL_CHARGES;
    expect(premiumLoadPct(1, c)).toBe(c.premiumLoadByYear[0]);
    expect(premiumLoadPct(10, c)).toBe(6);
    expect(premiumLoadPct(11, c)).toBe(4);
    expect(premiumLoadPct(40, c)).toBe(4); // past the end of the array
  });

  it("charges more per $1,000 at older issue ages", () => {
    const c = INDUSTRY_TYPICAL_CHARGES;
    expect(perThousandMonthly(60, c)).toBeGreaterThan(perThousandMonthly(35, c));
    expect(perThousandMonthly(20, c)).toBe(c.perThousandByIssueAge[0][1]); // clamped low
    expect(perThousandMonthly(90, c)).toBe(2.0); // clamped high
  });

  it("ships every preset marked unverified, so nothing is passed off as carrier pricing", () => {
    for (const preset of Object.values(CHARGE_PRESETS)) {
      expect(preset.verified).toBe(false);
      expect(preset.source.length).toBeGreaterThan(10);
    }
    expect(ALLIANZ_STYLE_CHARGES_UNVERIFIED.name).toContain("UNVERIFIED");
  });

  it("applies the asset charge only when the preset carries one", () => {
    const base = defaultInput({ age: 38, monthlyBudget: 900, incomeStartAge: 0 });
    const noAsset = projectDual({ ...base, charges: INDUSTRY_TYPICAL_CHARGES });
    const withAsset = projectDual({ ...base, charges: ALLIANZ_STYLE_CHARGES_UNVERIFIED });

    expect(noAsset.iul.every((y) => y.assetCharges === 0)).toBe(true);
    expect(withAsset.iul.some((y) => y.assetCharges > 0)).toBe(true);
    expect(withAsset.meta.totalChargesPaid).toBeGreaterThan(noAsset.meta.totalChargesPaid);
  });

  it("honours the preset's COI loading factor", () => {
    const base = defaultInput({ age: 45, monthlyBudget: 900, incomeStartAge: 0 });
    const cheap = projectDual({
      ...base, charges: { ...INDUSTRY_TYPICAL_CHARGES, coiLoadFactor: 1.0 },
    });
    const dear = projectDual({
      ...base, charges: { ...INDUSTRY_TYPICAL_CHARGES, coiLoadFactor: 2.5 },
    });
    expect(dear.iul[5].costOfInsurance).toBeGreaterThan(cheap.iul[5].costOfInsurance);
  });
});

describe("chargeBreakdown", () => {
  const proj = projectDual(defaultInput({
    age: 38, monthlyBudget: 900, termFace: 1_000_000, incomeStartAge: 0, windowStart: 1995,
  }));

  it("splits the first decade into parts that sum to the whole", () => {
    const b = chargeBreakdown(proj, 10);
    const parts = b.premiumLoad + b.policyFees + b.perThousand + b.costOfInsurance + b.riders + b.assetCharges;
    expect(parts).toBeCloseTo(b.total, 2);
  });

  it("front-loads: the first decade costs a bigger share of premium than the second", () => {
    const first = chargeBreakdown(proj, 10);
    const through20 = chargeBreakdown(proj, 20);
    const secondDecadePct =
      ((through20.total - first.total) / (through20.premiumsPaid - first.premiumsPaid)) * 100;
    expect(first.pctOfPremium).toBeGreaterThan(secondDecadePct);
  });

  it("keeps first-decade charges in a defensible band for a healthy 38-year-old", () => {
    const b = chargeBreakdown(proj, 10);
    expect(b.pctOfPremium).toBeGreaterThan(8);
    expect(b.pctOfPremium).toBeLessThan(30);
  });
});

describe("calibrate", () => {
  const input = defaultInput({ age: 38, monthlyBudget: 900, incomeStartAge: 0, windowStart: 1995 });

  it("reports no error against the model's own output", () => {
    const self = projectDual(input);
    const rows = [5, 10, 20].map((policyYear) => {
      const y = self.iul.find((r) => r.policyYear === policyYear)!;
      return { policyYear, premium: y.premiumPaid, accountValue: y.accountValue };
    });
    const result = calibrate(input, rows);
    expect(result.mape).toBeLessThan(0.01);
    expect(result.withinTolerance).toBe(true);
  });

  it("says the model is running high when the illustration shows less early on", () => {
    const self = projectDual(input);
    const rows = [3, 5, 8].map((policyYear) => {
      const y = self.iul.find((r) => r.policyYear === policyYear)!;
      return { policyYear, premium: y.premiumPaid, accountValue: y.accountValue * 0.8 };
    });
    const result = calibrate(input, rows);
    expect(result.withinTolerance).toBe(false);
    expect(result.notes.some((n) => n.includes("HIGH") && n.includes("years 1-10"))).toBe(true);
  });

  it("always warns when the charge structure is unverified", () => {
    const result = calibrate(input, [{ policyYear: 5, premium: 10_000, accountValue: 40_000 }]);
    expect(result.notes.some((n) => n.includes("UNVERIFIED"))).toBe(true);
    expect(result.verified).toBe(false);
  });
});

// ─── Needs analysis ───────────────────────────────────────────────────────────

import { assessIulFit, needsAnalysis, type HouseholdInput } from "./engine";

const HOUSEHOLD: HouseholdInput = {
  age: 38, gender: "male", smoker: false, annualIncome: 140_000,
  hasPartner: true, partnerIncome: 60_000, numChildren: 2, youngestChildAge: 4,
  retirementAge: 65,
  homeValue: 600_000, retirementAccounts: 200_000,
  savingsAndInvestments: 60_000, otherAssets: 0,
  mortgageBalance: 350_000, otherDebts: 20_000, existingLifeCoverage: 0,
  highInterestDebt: false, employerMatchCaptured: true,
  maxedTaxAdvantaged: true, incomeStability: "stable",
};

describe("needsAnalysis", () => {
  it("adds up what the family needs and subtracts what they can reach", () => {
    const a = needsAnalysis(HOUSEHOLD);
    expect(a.totalNeed).toBe(
      a.incomeReplacement + a.debtPayoff + a.educationFund + a.finalExpenses,
    );
    expect(a.totalAvailable).toBe(a.retirementAvailable + a.liquidAssets + a.existingCoverage);
    expect(a.gap).toBe(Math.max(0, a.totalNeed - a.totalAvailable));
  });

  it("never counts the family home as available capital", () => {
    const withMansion = needsAnalysis({ ...HOUSEHOLD, homeValue: 5_000_000 });
    const base = needsAnalysis(HOUSEHOLD);
    expect(withMansion.totalAvailable).toBe(base.totalAvailable);
    expect(withMansion.gap).toBe(base.gap);
    // It still counts toward net worth, just not toward covering the family.
    expect(withMansion.netWorth).toBeGreaterThan(base.netWorth);
  });

  it("discounts retirement accounts for the tax a survivor would pay", () => {
    const a = needsAnalysis(HOUSEHOLD);
    expect(a.retirementAvailable).toBeLessThan(HOUSEHOLD.retirementAccounts);
    expect(a.retirementAvailable).toBe(160_000);
  });

  it("needs less replaced when a partner earns", () => {
    const soleEarner = needsAnalysis({ ...HOUSEHOLD, partnerIncome: 0 });
    expect(soleEarner.incomeReplacement).toBeGreaterThan(needsAnalysis(HOUSEHOLD).incomeReplacement);
  });

  it("subtracts cover already in force", () => {
    const covered = needsAnalysis({ ...HOUSEHOLD, existingLifeCoverage: 500_000 });
    expect(covered.gap).toBeLessThan(needsAnalysis(HOUSEHOLD).gap);
  });

  it("splits the gap into term plus permanent, and the parts add up", () => {
    const a = needsAnalysis(HOUSEHOLD);
    expect(a.recommendedTermFace + a.recommendedPermanentFace).toBeLessThanOrEqual(a.gap + 50_000);
    expect(a.recommendedTermFace).toBeGreaterThan(0);
    expect(a.recommendedPermanentFace).toBeGreaterThan(0);
  });

  it("picks a standard term length that covers the dependency period", () => {
    const a = needsAnalysis(HOUSEHOLD);
    expect([10, 15, 20, 25, 30]).toContain(a.recommendedTermYears);
    expect(a.recommendedTermYears).toBeGreaterThanOrEqual(a.yearsOfSupport);
  });

  it("recommends nothing when the household is already self-insured", () => {
    const rich = needsAnalysis({
      ...HOUSEHOLD, savingsAndInvestments: 5_000_000, retirementAccounts: 3_000_000,
    });
    expect(rich.gap).toBe(0);
    expect(rich.recommendedTermFace).toBe(0);
    expect(rich.recommendedPermanentFace).toBe(0);
    expect(rich.reasons[0]).toContain("self-insured");
  });

  it("never recommends more permanent cover than the household is short", () => {
    const small = needsAnalysis({
      ...HOUSEHOLD, annualIncome: 40_000, mortgageBalance: 0, otherDebts: 0,
      numChildren: 0, savingsAndInvestments: 300_000, retirementAccounts: 200_000,
    });
    expect(small.recommendedPermanentFace).toBeLessThanOrEqual(small.gap);
  });

  it("explains itself in the household's own numbers", () => {
    const a = needsAnalysis(HOUSEHOLD);
    expect(a.reasons.length).toBeGreaterThan(3);
    for (const r of a.reasons) expect(r.length).toBeGreaterThan(25);
  });
});

describe("assessIulFit", () => {
  const analysis = needsAnalysis(HOUSEHOLD);

  it("says yes to the household it is actually built for", () => {
    const v = assessIulFit(HOUSEHOLD, analysis);
    expect(v.status).toBe("good_fit");
    expect(v.helps).toBe(true);
    expect(v.because.length).toBeGreaterThan(1);
  });

  it("refuses while high-interest debt or an unclaimed match is outstanding", () => {
    expect(assessIulFit({ ...HOUSEHOLD, highInterestDebt: true }, analysis).status).toBe("not_yet");
    expect(assessIulFit({ ...HOUSEHOLD, employerMatchCaptured: false }, analysis).status).toBe("not_yet");
  });

  it("derives thin reserves from savings rather than asking another question", () => {
    const broke = assessIulFit({ ...HOUSEHOLD, savingsAndInvestments: 2_000 }, analysis);
    expect(broke.status).toBe("not_yet");
    expect(broke.insteadDoThis.some((s) => s.includes("three to six months"))).toBe(true);
  });

  it("refuses when retirement is too close for the early costs to pay off", () => {
    expect(assessIulFit({ ...HOUSEHOLD, age: 60 }, analysis).status).toBe("not_yet");
  });

  it("downgrades to 'worth considering' when tax-advantaged room is still open", () => {
    const v = assessIulFit(
      { ...HOUSEHOLD, maxedTaxAdvantaged: false, annualIncome: 90_000 },
      needsAnalysis({ ...HOUSEHOLD, maxedTaxAdvantaged: false, annualIncome: 90_000 }),
    );
    expect(v.status).toBe("worth_considering");
    expect(v.insteadDoThis.length).toBeGreaterThan(0);
  });

  it("closes the protection argument when there is no gap, rather than inventing one", () => {
    const rich = { ...HOUSEHOLD, savingsAndInvestments: 5_000_000, retirementAccounts: 3_000_000 };
    const v = assessIulFit(rich, needsAnalysis(rich));
    expect(v.status).toBe("worth_considering");
    expect(v.because[0]).toContain("don't need this for protection");
    expect(v.headline).not.toContain("fits your situation well");
  });

  it("always gives a route forward when the answer is no", () => {
    const v = assessIulFit({ ...HOUSEHOLD, highInterestDebt: true }, analysis);
    expect(v.insteadDoThis.length).toBeGreaterThan(0);
  });

  it("suggests a funding range that brackets the recommended face", () => {
    const v = assessIulFit(HOUSEHOLD, analysis);
    expect(v.suggestedMonthlyHigh).toBeGreaterThan(v.suggestedMonthlyLow);
    expect(v.suggestedMonthlyLow).toBeGreaterThan(0);
  });
});
