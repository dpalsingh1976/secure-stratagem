/**
 * IUL projection engine.
 *
 * Deterministic, dependency-free and unit-tested. Every number the client sees
 * in the IUL explorer comes from here — never from the LLM. The LLM narrates
 * what this engine produces; it does not do arithmetic.
 *
 * This is an EDUCATIONAL MODEL, not a carrier illustration. Charges, mortality
 * and crediting are industry-typical approximations, not any carrier's actual
 * product. Nothing here is bound by AG 49-C because nothing here is an
 * illustration — but it deliberately follows that spirit: real index history
 * only, no cherry-picked backtests, no bonus/multiplier arbitrage.
 */

// ─── Historical index data ────────────────────────────────────────────────────

/**
 * S&P 500 calendar-year PRICE return (%), excluding dividends — which is what
 * indexed crediting actually tracks. Dividends are added separately for the
 * brokerage track, where the investor does receive them.
 */
export const SP500_PRICE_RETURNS: Record<number, number> = {
  1970: 0.1, 1971: 10.8, 1972: 15.6, 1973: -17.4, 1974: -29.7,
  1975: 31.5, 1976: 19.1, 1977: -11.5, 1978: 1.1, 1979: 12.3,
  1980: 25.8, 1981: -9.7, 1982: 14.8, 1983: 17.3, 1984: 1.4,
  1985: 26.3, 1986: 14.6, 1987: 2.0, 1988: 12.4, 1989: 27.3,
  1990: -6.6, 1991: 26.3, 1992: 4.5, 1993: 7.1, 1994: -1.5,
  1995: 34.1, 1996: 20.3, 1997: 31.0, 1998: 26.7, 1999: 19.5,
  2000: -10.1, 2001: -13.0, 2002: -23.4, 2003: 26.4, 2004: 9.0,
  2005: 3.0, 2006: 13.6, 2007: 3.5, 2008: -38.5, 2009: 23.5,
  2010: 12.8, 2011: 0.0, 2012: 13.4, 2013: 29.6, 2014: 11.4,
  2015: -0.7, 2016: 9.5, 2017: 19.4, 2018: -6.2, 2019: 28.9,
  2020: 16.3, 2021: 26.9, 2022: -19.4, 2023: 24.2, 2024: 23.3,
  2025: 8.0,
};

export const FIRST_HISTORICAL_YEAR = 1970;
export const LAST_HISTORICAL_YEAR = 2025;

/** Long-run dividend yield added back for the brokerage (total-return) track. */
export const DIVIDEND_YIELD = 1.9;

/**
 * Returns `years` calendar returns starting at `startYear`, wrapping around the
 * dataset if the window runs past the last year we have. Wrapping keeps every
 * window the same length so the two tracks stay comparable.
 */
export function historicalWindow(startYear: number, years: number): number[] {
  const span = LAST_HISTORICAL_YEAR - FIRST_HISTORICAL_YEAR + 1;
  const out: number[] = [];
  for (let i = 0; i < years; i++) {
    const y = FIRST_HISTORICAL_YEAR + (((startYear - FIRST_HISTORICAL_YEAR + i) % span) + span) % span;
    out.push(SP500_PRICE_RETURNS[y]);
  }
  return out;
}

// ─── Crediting ────────────────────────────────────────────────────────────────

export interface CreditingTerms {
  /** Worst annual credit, in percent. Industry standard is 0. */
  floor: number;
  /** Best annual credit, in percent. Industry average sat near 8–9% in 2026. */
  cap: number;
  /** Share of the index move that counts, in percent. 100 = full participation. */
  participation: number;
}

export const DEFAULT_CREDITING: CreditingTerms = { floor: 0, cap: 9, participation: 100 };

/** Annual point-to-point credit: participation first, then floor and cap. */
export function indexCredit(rawReturnPct: number, terms: CreditingTerms): number {
  const participated = rawReturnPct * (terms.participation / 100);
  return Math.min(Math.max(participated, terms.floor), terms.cap);
}

// ─── Actuarial tables ─────────────────────────────────────────────────────────

/** Linear interpolation across a sparse age-keyed table, clamped at both ends. */
function byAge(table: Array<[number, number]>, age: number): number {
  if (age <= table[0][0]) return table[0][1];
  const last = table[table.length - 1];
  if (age >= last[0]) return last[1];
  for (let i = 0; i < table.length - 1; i++) {
    const [a0, v0] = table[i];
    const [a1, v1] = table[i + 1];
    if (age >= a0 && age <= a1) return v0 + ((v1 - v0) * (age - a0)) / (a1 - a0);
  }
  return last[1];
}

/** Annual deaths per 1,000 — male non-smoker, approximating 2017 CSO ultimate. */
const MORTALITY_PER_1000: Array<[number, number]> = [
  [20, 0.50], [25, 0.55], [30, 0.63], [35, 0.76], [40, 1.00],
  [45, 1.42], [50, 2.10], [55, 3.20], [60, 5.10], [65, 8.40],
  [70, 13.9], [75, 23.5], [80, 41.0], [85, 72.0], [90, 128.0],
  [95, 220.0], [100, 350.0], [105, 550.0],
];

/**
 * Cost of insurance rate per $1,000 of net amount at risk, per year.
 * Carriers charge above pure mortality; the loading here is industry-typical.
 */
export function coiRatePer1000(
  age: number,
  gender: Gender,
  smoker: boolean,
  loadFactor = 1.5,
): number {
  const base = byAge(MORTALITY_PER_1000, age);
  const genderFactor = gender === "female" ? 0.75 : 1.0;
  const smokerFactor = smoker ? 2.2 : 1.0;
  return base * genderFactor * smokerFactor * loadFactor;
}

/** IRC §7702 corridor: the minimum ratio of death benefit to cash value. */
const CORRIDOR: Array<[number, number]> = [
  [40, 2.50], [45, 2.15], [50, 1.85], [55, 1.50], [60, 1.30],
  [65, 1.20], [70, 1.15], [75, 1.05], [90, 1.05], [95, 1.00],
];

export function corridorFactor(age: number): number {
  return byAge(CORRIDOR, age);
}

/**
 * Face amount per $1 of annual premium that keeps a policy outside MEC status
 * under the 7-pay test. Fund above this (i.e. buy LESS face for the premium)
 * and the policy becomes a MEC, which costs you the tax-free loan treatment.
 */
const MEC_FACE_MULTIPLE: Array<[number, number]> = [
  [25, 26.0], [30, 23.0], [35, 19.5], [40, 16.6], [45, 13.8],
  [50, 11.4], [55, 9.5], [60, 8.0], [65, 6.7], [70, 5.6],
];

export function minNonMecFace(age: number, annualPremium: number): number {
  return annualPremium * byAge(MEC_FACE_MULTIPLE, age);
}

// ─── Policy charge structure ──────────────────────────────────────────────────

export interface ChargeStructure {
  /** Human name shown in the UI and in the calibration report. */
  name: string;
  /**
   * False means these are illustrative industry-typical figures, NOT a real
   * carrier's rate book. Anything shown to a consumer from an unverified
   * structure must be labelled as an estimate. Set true only after the values
   * have been calibrated against an actual illustration.
   */
  verified: boolean;
  source: string;

  /**
   * Percent of each premium taken off the top, by policy year. The last entry
   * repeats for every later year, so [8,8,8,6,4] means 8% for three years,
   * 6% in year four, then 4% thereafter.
   */
  premiumLoadByYear: number[];

  /** Flat monthly administrative fee, in dollars. */
  monthlyPolicyFee: number;

  /**
   * Monthly charge per $1,000 of face, keyed by ISSUE age. This is the charge
   * that dominates the first decade and the one clients are most surprised by,
   * so it is age-banded rather than flat.
   */
  perThousandByIssueAge: Array<[number, number]>;
  perThousandYears: number;

  /**
   * Annual charge on the account value itself, as a percent. Common on bonused
   * and multiplier index strategies, where the bonus is paid for by this.
   */
  annualAssetChargePct: number;

  /** Multiplier applied over base mortality to get the charged COI rate. */
  coiLoadFactor: number;

  /** Rider cost as a fraction of the cost of insurance. */
  riderLoadOnCoi: number;

  /** Year-1 surrender charge per $1,000 of face, grading to zero. */
  surrenderChargePer1000: number;
  surrenderChargeYears: number;
}

/**
 * Industry-typical figures assembled from public product summaries. These are
 * a reasonable teaching model and are NOT any carrier's actual pricing.
 */
export const INDUSTRY_TYPICAL_CHARGES: ChargeStructure = {
  name: "Industry typical",
  verified: false,
  source: "Public product summaries; illustrative only.",
  premiumLoadByYear: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 4],
  monthlyPolicyFee: 10,
  perThousandByIssueAge: [
    [25, 0.12], [30, 0.16], [35, 0.20], [40, 0.27], [45, 0.38],
    [50, 0.52], [55, 0.75], [60, 1.05], [65, 1.45], [70, 2.00],
  ],
  perThousandYears: 10,
  annualAssetChargePct: 0,
  coiLoadFactor: 1.5,
  riderLoadOnCoi: 0.05,
  surrenderChargePer1000: 35,
  surrenderChargeYears: 13,
};

/**
 * Scaffold shaped like an Allianz accumulation-focused IUL — a premium load
 * that runs for the life of the policy, a per-$1,000 charge concentrated in the
 * first ten years, and an asset charge that pays for a bonused index strategy.
 *
 * ⚠ THE VALUES BELOW ARE PLACEHOLDERS, NOT ALLIANZ'S RATE BOOK.
 * They are here so the shape is right and real numbers can be dropped in.
 * Do not show output from this preset to a client as "Allianz" pricing until
 * `verified` is true — replace these with figures read off an actual
 * illustration and confirm with `calibrate()` below.
 */
export const ALLIANZ_STYLE_CHARGES_UNVERIFIED: ChargeStructure = {
  name: "Allianz-style (UNVERIFIED placeholder)",
  verified: false,
  source: "Structural shape only. Replace every value from a real illustration.",
  premiumLoadByYear: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6],
  monthlyPolicyFee: 10,
  perThousandByIssueAge: [
    [25, 0.14], [30, 0.18], [35, 0.24], [40, 0.32], [45, 0.45],
    [50, 0.62], [55, 0.88], [60, 1.24], [65, 1.70], [70, 2.35],
  ],
  perThousandYears: 10,
  annualAssetChargePct: 0.95,
  coiLoadFactor: 1.5,
  riderLoadOnCoi: 0.05,
  surrenderChargePer1000: 38,
  surrenderChargeYears: 10,
};

export const CHARGE_PRESETS: Record<string, ChargeStructure> = {
  industry: INDUSTRY_TYPICAL_CHARGES,
  allianz_style: ALLIANZ_STYLE_CHARGES_UNVERIFIED,
};

/** Kept as the default so existing callers are unaffected. */
export const DEFAULT_CHARGES: ChargeStructure = INDUSTRY_TYPICAL_CHARGES;

/** Premium load percent applying in a given policy year. */
export function premiumLoadPct(policyYear: number, charges: ChargeStructure): number {
  const bands = charges.premiumLoadByYear;
  if (bands.length === 0) return 0;
  return bands[Math.min(policyYear - 1, bands.length - 1)];
}

/** Monthly per-$1,000-of-face charge for a policy issued at `issueAge`. */
export function perThousandMonthly(issueAge: number, charges: ChargeStructure): number {
  return byAge(charges.perThousandByIssueAge, issueAge);
}

export function surrenderCharge(
  policyYear: number,
  faceAmount: number,
  charges: ChargeStructure = DEFAULT_CHARGES,
): number {
  if (policyYear > charges.surrenderChargeYears) return 0;
  const remaining = (charges.surrenderChargeYears - policyYear + 1) / charges.surrenderChargeYears;
  return (faceAmount / 1000) * charges.surrenderChargePer1000 * remaining;
}

// ─── Term insurance pricing ───────────────────────────────────────────────────

export type Gender = "male" | "female" | "other";

const TERM_MONTHLY_PER_MILLION: Array<[number, number]> = [
  [25, 20], [30, 25], [35, 35], [40, 55], [45, 90],
  [50, 145], [55, 230], [60, 390], [65, 660],
];

const TERM_LENGTH_FACTOR: Record<number, number> = { 10: 0.70, 15: 0.85, 20: 1.0, 25: 1.2, 30: 1.45 };

/** Monthly premium for a level term policy, in dollars. */
export function termMonthlyPremium(
  face: number,
  age: number,
  termYears: number,
  gender: Gender,
  smoker: boolean,
): number {
  if (face <= 0) return 0;
  const perMillion = byAge(TERM_MONTHLY_PER_MILLION, age);
  const lengthFactor = TERM_LENGTH_FACTOR[termYears] ?? 1.0;
  const genderFactor = gender === "female" ? 0.85 : 1.0;
  const smokerFactor = smoker ? 2.5 : 1.0;
  return (face / 1_000_000) * perMillion * lengthFactor * genderFactor * smokerFactor;
}

// ─── Life events ──────────────────────────────────────────────────────────────

export type LifeEvent =
  /** Income stops; policy charges keep coming out of cash value. */
  | { kind: "premium_holiday"; atAge: number; years: number }
  /** Override the index return in one specific year. */
  | { kind: "market_shock"; atAge: number; returnPct: number }
  /** Accelerate part of the death benefit to pay for care. */
  | { kind: "chronic_illness"; atAge: number; accelerateFraction: number }
  /** A one-off cash need — tuition, a business, a roof. */
  | { kind: "lump_need"; atAge: number; amount: number }
  /** The insured dies; both tracks stop and pay out. */
  | { kind: "death"; atAge: number };

// ─── Projection input ─────────────────────────────────────────────────────────

export interface DualInput {
  age: number;
  gender: Gender;
  smoker: boolean;
  /** Total monthly dollars available for protection + saving, combined. */
  monthlyBudget: number;
  /** Level term face carried in BOTH tracks, so the comparison stays fair. */
  termFace: number;
  termYears: number;
  /** Death benefit on the IUL. Defaults to the minimum non-MEC face. */
  iulFace?: number;
  /** Years of IUL funding / brokerage contributions. */
  fundingYears: number;
  /** Age at which tax-free income begins. 0 disables the income phase. */
  incomeStartAge: number;
  /** After-tax annual spend drawn in the income phase. */
  annualIncomeTarget: number;
  incomeYears: number;
  endAge: number;
  crediting: CreditingTerms;
  charges: ChargeStructure;
  /** First calendar year of the historical return window. */
  windowStart: number;
  /** Annual policy loan interest rate, percent. */
  loanRate: number;
  /** Long-term capital gains + dividend tax rate applied to the brokerage. */
  capitalGainsRate: number;
  events: LifeEvent[];
}

export function defaultInput(partial: Partial<DualInput> = {}): DualInput {
  const age = partial.age ?? 38;
  return {
    age,
    gender: "male",
    smoker: false,
    monthlyBudget: 800,
    termFace: 750_000,
    termYears: 20,
    fundingYears: 20,
    incomeStartAge: 65,
    annualIncomeTarget: 40_000,
    incomeYears: 20,
    endAge: 95,
    crediting: { ...DEFAULT_CREDITING },
    charges: { ...DEFAULT_CHARGES },
    windowStart: 1990,
    loanRate: 5,
    capitalGainsRate: 15,
    events: [],
    ...partial,
  };
}

// ─── Projection output ────────────────────────────────────────────────────────

export interface IulYear {
  policyYear: number;
  age: number;
  calendarYear: number;
  premiumPaid: number;
  cumulativePremium: number;
  premiumLoad: number;
  policyFees: number;
  perThousandCharges: number;
  costOfInsurance: number;
  riderCharges: number;
  assetCharges: number;
  totalCharges: number;
  indexReturn: number;
  creditedRate: number;
  interestCredited: number;
  accountValue: number;
  surrenderValue: number;
  deathBenefit: number;
  loanBalance: number;
  netCashValue: number;
  /** What the family receives if the insured dies this year, term included. */
  payoutOnDeath: number;
  /** Charges as a percent of the account value they were taken from. */
  chargeDragPct: number;
  distribution: number;
  acceleratedBenefit: number;
  lapsed: boolean;
  note?: string;
}

export interface BrokerageYear {
  policyYear: number;
  age: number;
  calendarYear: number;
  contribution: number;
  cumulativeContribution: number;
  termPremiumPaid: number;
  grossReturn: number;
  balance: number;
  costBasis: number;
  taxPaid: number;
  distribution: number;
  /** What the family receives if the insured dies this year. */
  payoutOnDeath: number;
  depleted: boolean;
  note?: string;
}

export interface DualProjection {
  iul: IulYear[];
  brokerage: BrokerageYear[];
  meta: {
    termMonthlyPremium: number;
    monthlyIntoVehicle: number;
    iulFace: number;
    isMec: boolean;
    minNonMecFace: number;
    /** First policy year where surrender value exceeds premiums paid. */
    breakEvenYear: number | null;
    totalChargesPaid: number;
    iulLapseAge: number | null;
    brokerageDepletedAge: number | null;
    totalTaxFreeIncome: number;
    totalBrokerageIncome: number;
    brokerageTaxPaid: number;
  };
}

// ─── The projection ───────────────────────────────────────────────────────────

/**
 * Runs both tracks over the same life, the same budget and the same index
 * history, so the only difference between them is the vehicle.
 *
 * Interest is credited annually on the average monthly account value, which
 * approximates how a carrier credits rolling monthly segments.
 */
export function projectDual(input: DualInput): DualProjection {
  const {
    age, gender, smoker, monthlyBudget, termFace, termYears,
    fundingYears, incomeStartAge, annualIncomeTarget, incomeYears,
    endAge, crediting, charges, windowStart, loanRate, capitalGainsRate, events,
  } = input;

  const totalYears = Math.max(1, endAge - age + 1);
  const returns = historicalWindow(windowStart, totalYears);

  const termPremium = termMonthlyPremium(termFace, age, termYears, gender, smoker);
  const monthlyIntoVehicle = Math.max(0, monthlyBudget - termPremium);
  const annualPremium = monthlyIntoVehicle * 12;

  const mecFloor = minNonMecFace(age, annualPremium);
  const iulFace = input.iulFace ?? Math.max(mecFloor, 50_000);
  const isMec = annualPremium > 0 && iulFace < mecFloor - 1;

  const deathEvent = events.find((e) => e.kind === "death") as Extract<LifeEvent, { kind: "death" }> | undefined;
  const holiday = events.find((e) => e.kind === "premium_holiday") as Extract<LifeEvent, { kind: "premium_holiday" }> | undefined;
  const shocks = events.filter((e): e is Extract<LifeEvent, { kind: "market_shock" }> => e.kind === "market_shock");
  const illness = events.find((e) => e.kind === "chronic_illness") as Extract<LifeEvent, { kind: "chronic_illness" }> | undefined;
  const lumps = events.filter((e): e is Extract<LifeEvent, { kind: "lump_need" }> => e.kind === "lump_need");

  // ── IUL track ───────────────────────────────────────────────────────────────
  const iul: IulYear[] = [];
  let av = 0;
  let basis = 0;
  let cumPremium = 0;
  let loanBalance = 0;
  let face = iulFace;
  let lapsed = false;
  let lapseAge: number | null = null;
  let totalCharges = 0;
  let totalTaxFreeIncome = 0;
  let breakEvenYear: number | null = null;

  // ── Brokerage track ─────────────────────────────────────────────────────────
  const brokerage: BrokerageYear[] = [];
  let balance = 0;
  let costBasis = 0;
  let cumContribution = 0;
  let depleted = false;
  let depletedAge: number | null = null;
  let totalBrokerageIncome = 0;
  let brokerageTaxPaid = 0;

  for (let y = 0; y < totalYears; y++) {
    const policyYear = y + 1;
    const currentAge = age + y;
    const calendarYear = windowStart + y;
    const dead = deathEvent != null && currentAge > deathEvent.atAge;

    const shock = shocks.find((s) => s.atAge === currentAge);
    const rawReturn = shock ? shock.returnPct : returns[y];

    const onHoliday =
      holiday != null && currentAge >= holiday.atAge && currentAge < holiday.atAge + holiday.years;
    const funding = policyYear <= fundingYears && !onHoliday && !dead;

    const inIncomePhase =
      incomeStartAge > 0 &&
      currentAge >= incomeStartAge &&
      currentAge < incomeStartAge + incomeYears &&
      !dead;

    const lumpThisYear = lumps.filter((l) => l.atAge === currentAge).reduce((s, l) => s + l.amount, 0);

    // ── IUL: twelve months of premium in, charges out ─────────────────────────
    const premiumThisYear = funding ? annualPremium : 0;
    const loadPct = premiumLoadPct(policyYear, charges);

    let premiumLoad = 0;
    let policyFees = 0;
    let perThousand = 0;
    let coi = 0;
    let riders = 0;
    let assetCharges = 0;
    let avSum = 0;
    const startAv = av;

    if (!lapsed) {
      for (let m = 0; m < 12; m++) {
        if (premiumThisYear > 0) {
          const gross = premiumThisYear / 12;
          const load = gross * (loadPct / 100);
          premiumLoad += load;
          av += gross - load;
          basis += gross;
          cumPremium += gross;
        }

        const fee = charges.monthlyPolicyFee;
        const perK =
          policyYear <= charges.perThousandYears
            ? (face / 1000) * perThousandMonthly(age, charges)
            : 0;

        const db = Math.max(face, av * corridorFactor(currentAge));
        const nar = Math.max(0, db - av);
        const monthlyCoi =
          (nar / 1000) * (coiRatePer1000(currentAge, gender, smoker, charges.coiLoadFactor) / 12);
        const rider = monthlyCoi * charges.riderLoadOnCoi;
        // Asset-based charge: levied on the account value, every month it exists.
        const assetCharge = Math.max(0, av) * (charges.annualAssetChargePct / 100 / 12);

        policyFees += fee;
        perThousand += perK;
        coi += monthlyCoi;
        riders += rider;
        assetCharges += assetCharge;

        av -= fee + perK + monthlyCoi + rider + assetCharge;
        avSum += Math.max(0, av);

        if (av <= 0) {
          av = 0;
          lapsed = true;
          lapseAge = currentAge;
          break;
        }
      }
    }

    const yearCharges = premiumLoad + policyFees + perThousand + coi + riders + assetCharges;
    totalCharges += yearCharges;

    // Credit interest on the average balance the charges were drawn from.
    const creditedRate = lapsed ? 0 : indexCredit(rawReturn, crediting);
    const avgAv = avSum / 12;
    const interest = lapsed ? 0 : avgAv * (creditedRate / 100);
    av += interest;

    // Chronic illness rider accelerates part of the death benefit. The policy
    // is reduced pro rata: face, cash value and basis all scale down together.
    let note: string | undefined;
    let acceleratedBenefit = 0;
    if (illness && currentAge === illness.atAge && !lapsed) {
      const f = Math.min(1, Math.max(0, illness.accelerateFraction));
      const db = Math.max(face, av * corridorFactor(currentAge));
      acceleratedBenefit = db * f;
      face = Math.max(0, face * (1 - f));
      av = Math.max(0, av * (1 - f));
      basis = Math.max(0, basis * (1 - f));
      note = `Chronic illness rider paid ${fmtUsd(acceleratedBenefit)} tax-free — the policy is reduced pro rata to cover it.`;
    }

    // Income phase and lump-sum needs come out as loans once basis is spent.
    let distribution = acceleratedBenefit;
    totalTaxFreeIncome += acceleratedBenefit;
    if (!lapsed && (inIncomePhase || lumpThisYear > 0)) {
      const want = (inIncomePhase ? annualIncomeTarget : 0) + lumpThisYear;
      const available = Math.max(0, av - loanBalance);
      const taken = Math.min(want, available * 0.92); // leave a cushion against lapse
      const fromBasis = Math.min(taken, basis);
      const fromLoan = taken - fromBasis;

      av -= fromBasis;
      basis -= fromBasis;
      // A withdrawal under a level death benefit reduces the specified amount.
      face = Math.max(0, face - fromBasis);
      loanBalance += fromLoan;
      distribution += taken;
      totalTaxFreeIncome += taken;
    }

    if (loanBalance > 0 && !lapsed) loanBalance *= 1 + loanRate / 100;

    if (!lapsed && loanBalance >= av && av > 0) {
      lapsed = true;
      lapseAge = currentAge;
      note = `Loan balance overtook cash value — the policy lapses and the gain becomes taxable income in a single year.`;
    }

    const sc = surrenderCharge(policyYear, face, charges);
    const surrenderValue = Math.max(0, av - sc - loanBalance);
    const deathBenefit = lapsed ? 0 : Math.max(0, Math.max(face, av * corridorFactor(currentAge)) - loanBalance);

    if (breakEvenYear === null && surrenderValue > cumPremium && cumPremium > 0) breakEvenYear = policyYear;

    iul.push({
      policyYear, age: currentAge, calendarYear,
      premiumPaid: premiumThisYear,
      cumulativePremium: cumPremium,
      premiumLoad, policyFees,
      perThousandCharges: perThousand,
      costOfInsurance: coi,
      riderCharges: riders,
      assetCharges,
      totalCharges: yearCharges,
      indexReturn: rawReturn,
      creditedRate,
      interestCredited: interest,
      accountValue: av,
      surrenderValue,
      deathBenefit,
      loanBalance,
      netCashValue: Math.max(0, av - loanBalance),
      payoutOnDeath: deathBenefit + (policyYear <= termYears ? termFace : 0),
      chargeDragPct: startAv + premiumThisYear > 0 ? (yearCharges / (startAv + premiumThisYear)) * 100 : 0,
      distribution,
      acceleratedBenefit,
      lapsed,
      note,
    });

    // ── Brokerage track: same dollars, no floor, no death benefit ─────────────
    const contribution = funding ? annualPremium : 0;
    const termPaid = policyYear <= termYears && !dead ? termPremium * 12 : 0;

    let bNote: string | undefined;
    if (!depleted) {
      balance += contribution;
      costBasis += contribution;
      cumContribution += contribution;

      const totalReturn = rawReturn + DIVIDEND_YIELD;
      const growth = balance * (totalReturn / 100);
      balance = Math.max(0, balance + growth);

      // Dividends are taxed every year whether or not you sell.
      const dividendTax = balance * (DIVIDEND_YIELD / 100) * (capitalGainsRate / 100);
      balance -= dividendTax;
      brokerageTaxPaid += dividendTax;
    }

    let bDistribution = 0;
    let yearTax = 0;
    if (!depleted && (inIncomePhase || lumpThisYear > 0)) {
      const want = (inIncomePhase ? annualIncomeTarget : 0) + lumpThisYear;
      // Gross up: selling shares realises a gain, and the gain is taxed.
      const gainFraction = balance > 0 ? Math.max(0, (balance - costBasis) / balance) : 0;
      const grossNeeded = want / Math.max(0.01, 1 - gainFraction * (capitalGainsRate / 100));
      const gross = Math.min(grossNeeded, balance);

      const basisPortion = gross * (1 - gainFraction);
      yearTax = gross * gainFraction * (capitalGainsRate / 100);
      balance -= gross;
      costBasis = Math.max(0, costBasis - basisPortion);
      bDistribution = gross - yearTax;
      totalBrokerageIncome += bDistribution;
      brokerageTaxPaid += yearTax;

      if (balance <= 1 && want > 0) {
        depleted = true;
        depletedAge = currentAge;
        bNote = `The account runs dry at ${currentAge} — there is nothing left to draw and no death benefit behind it.`;
      }
    }

    // Illness in the brokerage track means selling assets at whatever the
    // market is doing that year; there is no rider to call on.
    if (illness && currentAge === illness.atAge && !depleted) {
      bNote = `No rider here — care has to be funded by selling ${rawReturn < 0 ? "into a down market" : "assets"} and paying tax on the gain.`;
    }

    brokerage.push({
      policyYear, age: currentAge, calendarYear,
      contribution,
      cumulativeContribution: cumContribution,
      termPremiumPaid: termPaid,
      grossReturn: rawReturn + DIVIDEND_YIELD,
      balance,
      costBasis,
      taxPaid: yearTax,
      distribution: bDistribution,
      payoutOnDeath: balance + (policyYear <= termYears ? termFace : 0),
      depleted,
      note: bNote,
    });

    if (deathEvent != null && currentAge >= deathEvent.atAge) break;
  }

  return {
    iul,
    brokerage,
    meta: {
      termMonthlyPremium: termPremium,
      monthlyIntoVehicle,
      iulFace,
      isMec,
      minNonMecFace: mecFloor,
      breakEvenYear,
      totalChargesPaid: totalCharges,
      iulLapseAge: lapseAge,
      brokerageDepletedAge: depletedAge,
      totalTaxFreeIncome,
      totalBrokerageIncome,
      brokerageTaxPaid,
    },
  };
}

// ─── Calibration against a real illustration ──────────────────────────────────

/** One row read off a carrier illustration. */
export interface IllustrationRow {
  policyYear: number;
  /** Premium paid that year, per the illustration. */
  premium: number;
  /** Non-guaranteed accumulation/cash value at end of that policy year. */
  accountValue: number;
  /** Surrender value at end of that policy year, if the illustration shows it. */
  surrenderValue?: number;
}

export interface CalibrationResult {
  chargeStructure: string;
  verified: boolean;
  rows: Array<{
    policyYear: number;
    illustrated: number;
    modelled: number;
    diff: number;
    /** Signed percentage difference; negative means the model is too low. */
    diffPct: number;
  }>;
  /** Mean absolute percentage error across the compared years. */
  mape: number;
  /** Largest single-year percentage miss. */
  worstPct: number;
  /** True when every compared year is within `tolerancePct`. */
  withinTolerance: boolean;
  notes: string[];
}

/**
 * Compares engine output against rows read off an actual carrier illustration
 * and reports how far off it is. This is how an unverified charge preset gets
 * turned into a trustworthy one: run it, adjust the charge values, run it
 * again, and only set `verified: true` once the error is acceptable.
 *
 * Nothing here changes the model. It only measures it.
 */
export function calibrate(
  input: DualInput,
  illustration: IllustrationRow[],
  tolerancePct = 5,
): CalibrationResult {
  const projection = projectDual(input);
  const notes: string[] = [];

  const rows = illustration.map((ref) => {
    const modelRow = projection.iul.find((y) => y.policyYear === ref.policyYear);
    const modelled = modelRow?.accountValue ?? 0;
    const diff = modelled - ref.accountValue;
    const diffPct = ref.accountValue !== 0 ? (diff / ref.accountValue) * 100 : 0;
    return { policyYear: ref.policyYear, illustrated: ref.accountValue, modelled, diff, diffPct };
  });

  const mape = rows.length
    ? rows.reduce((sum, r) => sum + Math.abs(r.diffPct), 0) / rows.length
    : 0;
  const worstPct = rows.reduce((worst, r) => Math.max(worst, Math.abs(r.diffPct)), 0);

  const earlyRows = rows.filter((r) => r.policyYear <= 10);
  const earlyBias = earlyRows.length
    ? earlyRows.reduce((sum, r) => sum + r.diffPct, 0) / earlyRows.length
    : 0;

  if (earlyBias > tolerancePct) {
    notes.push(
      `Model runs ${earlyBias.toFixed(1)}% HIGH in years 1-10 — first-decade charges are understated. Raise perThousandByIssueAge, premiumLoadByYear, or annualAssetChargePct.`,
    );
  } else if (earlyBias < -tolerancePct) {
    notes.push(
      `Model runs ${Math.abs(earlyBias).toFixed(1)}% LOW in years 1-10 — first-decade charges are overstated. Lower perThousandByIssueAge or premiumLoadByYear.`,
    );
  }

  const lateRows = rows.filter((r) => r.policyYear > 10);
  const lateBias = lateRows.length
    ? lateRows.reduce((sum, r) => sum + r.diffPct, 0) / lateRows.length
    : 0;
  if (Math.abs(lateBias) > tolerancePct) {
    notes.push(
      `Model runs ${lateBias > 0 ? "HIGH" : "LOW"} by ${Math.abs(lateBias).toFixed(1)}% after year 10 — check coiLoadFactor and the assumed crediting rate against the illustration's.`,
    );
  }

  if (!input.charges.verified) {
    notes.push(
      `Charge structure "${input.charges.name}" is marked UNVERIFIED. Do not present its output to a client as carrier pricing.`,
    );
  }

  return {
    chargeStructure: input.charges.name,
    verified: input.charges.verified,
    rows,
    mape,
    worstPct,
    withinTolerance: rows.length > 0 && worstPct <= tolerancePct,
    notes,
  };
}

/**
 * Total charges over a span, split by kind. This is what the "what does it
 * cost?" disclosure should read from, and what to compare against an
 * illustration's own expense pages.
 */
export function chargeBreakdown(projection: DualProjection, throughPolicyYear: number) {
  const rows = projection.iul.filter((y) => y.policyYear <= throughPolicyYear);
  const sum = (f: (y: IulYear) => number) => rows.reduce((s, y) => s + f(y), 0);
  const total = sum((y) => y.totalCharges);
  const premiums = sum((y) => y.premiumPaid);
  return {
    premiumLoad: sum((y) => y.premiumLoad),
    policyFees: sum((y) => y.policyFees),
    perThousand: sum((y) => y.perThousandCharges),
    costOfInsurance: sum((y) => y.costOfInsurance),
    riders: sum((y) => y.riderCharges),
    assetCharges: sum((y) => y.assetCharges),
    total,
    premiumsPaid: premiums,
    /** Charges as a share of every premium dollar paid over the span. */
    pctOfPremium: premiums > 0 ? (total / premiums) * 100 : 0,
  };
}

// ─── The risk hump ────────────────────────────────────────────────────────────

export interface RiskPoint {
  age: number;
  need: number;
}

export interface RiskInput {
  age: number;
  annualIncome: number;
  mortgageBalance: number;
  otherDebts: number;
  numChildren: number;
  youngestChildAge: number;
  retirementAge: number;
  existingCoverage: number;
}

/**
 * The shape of a family's protection need over time: high while there is a
 * mortgage, children at home and earning years ahead — decaying to near zero
 * once those are behind them. This is why term is priced the way it is, and
 * it's the honest reason a term policy ends.
 */
export function riskCurve(input: RiskInput): RiskPoint[] {
  const { age, annualIncome, mortgageBalance, otherDebts, numChildren, youngestChildAge, retirementAge, existingCoverage } = input;
  const points: RiskPoint[] = [];
  const mortgageYears = 25;

  for (let a = age; a <= Math.min(95, retirementAge + 20); a++) {
    const elapsed = a - age;

    const yearsEarningLeft = Math.max(0, retirementAge - a);
    const incomeNeed = annualIncome * Math.min(yearsEarningLeft, 20) * 0.7;

    const mortgageLeft = Math.max(0, mortgageBalance * (1 - elapsed / mortgageYears));
    const debtLeft = Math.max(0, otherDebts * (1 - elapsed / 8));

    const childYearsLeft = Math.max(0, 22 - (youngestChildAge + elapsed));
    const educationNeed = numChildren * 50_000 * Math.min(1, childYearsLeft / 18);

    const gross = incomeNeed + mortgageLeft + debtLeft + educationNeed;
    points.push({ age: a, need: Math.max(0, gross - existingCoverage) });
  }
  return points;
}

// ─── Needs analysis: the risk of dying too soon ───────────────────────────────

/**
 * Everything the household owns, owes and earns. Deliberately short — each
 * field has to earn its place, because every extra question costs completions.
 */
export interface HouseholdInput {
  age: number;
  gender: Gender;
  smoker: boolean;
  annualIncome: number;

  hasPartner: boolean;
  partnerIncome: number;
  numChildren: number;
  youngestChildAge: number;
  retirementAge: number;

  // What they own
  homeValue: number;
  retirementAccounts: number;
  savingsAndInvestments: number;
  otherAssets: number;

  // What they owe
  mortgageBalance: number;
  otherDebts: number;
  existingLifeCoverage: number;

  // Single-toggle inputs folded into the asset and debt screens
  highInterestDebt: boolean;
  employerMatchCaptured: boolean;
  maxedTaxAdvantaged: boolean;
  incomeStability: "stable" | "variable" | "uncertain";
}

export interface NeedsAnalysis {
  /** What the family would need if the income stopped today. */
  incomeReplacement: number;
  debtPayoff: number;
  educationFund: number;
  finalExpenses: number;
  totalNeed: number;

  /** What they could actually reach. The home is deliberately excluded. */
  liquidAssets: number;
  retirementAvailable: number;
  existingCoverage: number;
  totalAvailable: number;

  /** What is genuinely missing. Zero means they are already covered. */
  gap: number;
  yearsOfSupport: number;

  /** The recommendation. */
  recommendedTermFace: number;
  recommendedTermYears: number;
  recommendedPermanentFace: number;

  netWorth: number;
  /** Plain-language reasoning, each line referencing their own numbers. */
  reasons: string[];
}

/** Present value of a level annual amount, in today's money. */
function pvAnnuity(payment: number, years: number, realRate = 0.03): number {
  if (years <= 0 || payment <= 0) return 0;
  if (realRate === 0) return payment * years;
  return (payment * (1 - Math.pow(1 + realRate, -years))) / realRate;
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

const STANDARD_TERMS = [10, 15, 20, 25, 30];

/**
 * Works out how much protection the family is actually short, then splits it
 * into the part that is temporary (term) and the part that never goes away
 * (permanent).
 *
 * The split is not arbitrary. Income replacement, the mortgage and education
 * all end — a child grows up, a loan gets paid, a career finishes. Term is the
 * efficient tool for those and it is priced accordingly. Final expenses and a
 * surviving partner's need after the term runs out do not end, and term cannot
 * cover them because it will have expired.
 */
export function needsAnalysis(h: HouseholdInput): NeedsAnalysis {
  const reasons: string[] = [];

  // ── How long the family would depend on this income ──
  const yearsToRetirement = Math.max(0, h.retirementAge - h.age);
  const yearsOfChildDependency =
    h.numChildren > 0 ? Math.max(0, 22 - h.youngestChildAge) : 0;
  const yearsOfSupport = Math.min(30, Math.max(yearsOfChildDependency, yearsToRetirement));

  // ── What they'd need ──
  // A surviving partner who earns needs less replaced than one who doesn't.
  const replacementRatio = h.hasPartner && h.partnerIncome > 0 ? 0.6 : 0.75;
  const incomeReplacement = Math.round(
    pvAnnuity(h.annualIncome * replacementRatio, yearsOfSupport),
  );

  const debtPayoff = h.mortgageBalance + h.otherDebts;
  const educationFund = yearsOfChildDependency > 0 ? h.numChildren * 50_000 : 0;
  const finalExpenses = 20_000;
  const totalNeed = incomeReplacement + debtPayoff + educationFund + finalExpenses;

  // ── What they'd have ──
  // Retirement accounts are discounted for the tax a survivor pays to use them.
  const retirementAvailable = Math.round(h.retirementAccounts * 0.8);
  // The home is NOT counted. The family has to live somewhere, and selling it
  // is the outcome this is meant to prevent.
  const liquidAssets = h.savingsAndInvestments + Math.round(h.otherAssets * 0.5);
  const totalAvailable = retirementAvailable + liquidAssets + h.existingLifeCoverage;

  const gap = Math.max(0, totalNeed - totalAvailable);
  const netWorth =
    h.homeValue + h.retirementAccounts + h.savingsAndInvestments + h.otherAssets
    - h.mortgageBalance - h.otherDebts;

  // ── Term length: long enough to cover the dependency, rounded up ──
  const recommendedTermYears =
    STANDARD_TERMS.find((t) => t >= yearsOfSupport) ?? 30;

  // ── The permanent slice: what will still be there when the term isn't ──
  let permanent = finalExpenses;
  if (h.hasPartner) {
    // A cushion for a partner who outlives the term.
    permanent += h.annualIncome * 1.5;
  }
  permanent = roundTo(permanent, 25_000);
  // Never recommend more permanent cover than they are actually short.
  const recommendedPermanentFace = gap > 0 ? Math.min(permanent, gap) : 0;
  const recommendedTermFace = Math.max(0, roundTo(gap - recommendedPermanentFace, 50_000));

  // ── Reasoning, in their own numbers ──
  if (gap <= 0) {
    reasons.push(
      `Your assets and existing cover of ${fmtUsd(totalAvailable)} already exceed the ${fmtUsd(totalNeed)} your family would need. On the death side, you are effectively self-insured.`,
    );
  } else {
    reasons.push(
      `Your family would need about ${fmtUsd(totalNeed)}, and could reach roughly ${fmtUsd(totalAvailable)} of it today. That leaves ${fmtUsd(gap)} missing.`,
    );
    reasons.push(
      `${fmtUsd(incomeReplacement)} of that is replacing your income for the ${yearsOfSupport} years your family would still depend on it.`,
    );
    if (debtPayoff > 0) {
      reasons.push(`${fmtUsd(debtPayoff)} clears the mortgage and other debts so nobody has to move.`);
    }
    if (educationFund > 0) {
      reasons.push(
        `${fmtUsd(educationFund)} covers education for ${h.numChildren === 1 ? "your child" : `your ${h.numChildren} children`}.`,
      );
    }
    if (h.existingLifeCoverage > 0) {
      reasons.push(`We've already subtracted the ${fmtUsd(h.existingLifeCoverage)} of cover you have.`);
    }
    reasons.push(
      `Most of this need disappears over time, so ${fmtUsd(recommendedTermFace)} of ${recommendedTermYears}-year term covers it cheaply. The remaining ${fmtUsd(recommendedPermanentFace)} doesn't disappear — that's the part term can't reach, because it will have expired.`,
    );
  }

  return {
    incomeReplacement, debtPayoff, educationFund, finalExpenses, totalNeed,
    liquidAssets, retirementAvailable, existingCoverage: h.existingLifeCoverage,
    totalAvailable, gap, yearsOfSupport,
    recommendedTermFace, recommendedTermYears, recommendedPermanentFace,
    netWorth, reasons,
  };
}

// ─── Does IUL actually help this household? ───────────────────────────────────

export interface IulVerdict {
  helps: boolean;
  /** "not_yet" outranks everything: fix the basics before funding a policy. */
  status: "good_fit" | "worth_considering" | "not_yet";
  headline: string;
  because: string[];
  /** Shown when the answer is no, or not yet. */
  insteadDoThis: string[];
  /** Monthly funding range that keeps the recommended face outside MEC. */
  suggestedMonthlyLow: number;
  suggestedMonthlyHigh: number;
}

/**
 * Answers the question the client is actually asking: does this help ME?
 *
 * Deliberately willing to say no. A tool that always says yes is worth nothing
 * as evidence, and an unsuitable sale is a lapse and a chargeback later.
 */
export function assessIulFit(h: HouseholdInput, analysis: NeedsAnalysis): IulVerdict {
  const because: string[] = [];
  const insteadDoThis: string[] = [];

  // Estimated months of reserves, derived rather than asked: living costs
  // approximated at 60% of gross income.
  const monthlyExpenses = (h.annualIncome * 0.6) / 12;
  const emergencyMonths = monthlyExpenses > 0 ? h.savingsAndInvestments / monthlyExpenses : 0;

  const blockers: string[] = [];
  if (h.highInterestDebt) {
    blockers.push("high-interest debt");
    insteadDoThis.push("Clear the high-interest debt first — paying off a 22% card is a guaranteed 22% return.");
  }
  if (!h.employerMatchCaptured) {
    blockers.push("unclaimed employer match");
    insteadDoThis.push("Take the full employer 401(k) match first. It's free money and nothing beats it.");
  }
  if (emergencyMonths < 3) {
    blockers.push("thin emergency reserves");
    insteadDoThis.push("Build three to six months of expenses in savings you can reach instantly.");
  }
  if (h.incomeStability === "uncertain") {
    blockers.push("unpredictable income");
    insteadDoThis.push("Revisit once your income has been steady for a year — this works best when you never have to stop.");
  }
  if (h.retirementAge - h.age < 10) {
    blockers.push("short runway");
    insteadDoThis.push("With under ten years to retirement, the early costs don't have time to be worth it.");
  }

  // Funding range for the permanent slice.
  const face = analysis.recommendedPermanentFace;
  const mecFactor = face > 0 ? face / Math.max(1, minNonMecFace(h.age, 1)) : 0;
  const suggestedMonthlyHigh = Math.round(mecFactor / 12 / 25) * 25;
  const suggestedMonthlyLow = Math.round((suggestedMonthlyHigh * 0.4) / 25) * 25;

  if (blockers.length > 0) {
    return {
      helps: false,
      status: "not_yet",
      headline: "Worth sorting a couple of things out first",
      because: [
        `Before funding a long-term plan, it's worth dealing with ${blockers.join(", ")}.`,
        "This isn't a no forever — it's a no for now, and the reasons are fixable.",
      ],
      insteadDoThis,
      suggestedMonthlyLow, suggestedMonthlyHigh,
    };
  }

  // When there is no protection gap, the death-benefit argument is closed and
  // saying otherwise would be dishonest. Any remaining case is accumulation.
  if (analysis.gap <= 0) {
    because.push(
      `Your assets already cover what your family would need, so you don't need this for protection — and we won't pretend otherwise.`,
    );
    if (h.maxedTaxAdvantaged) {
      because.push("What's left is the tax question: you've filled your 401(k) and IRA, and growth in here isn't taxed.");
      return {
        helps: true,
        status: "worth_considering",
        headline: "Not for protection — but the tax treatment may still be worth it",
        because,
        insteadDoThis: [],
        suggestedMonthlyLow, suggestedMonthlyHigh,
      };
    }
    return {
      helps: false,
      status: "worth_considering",
      headline: "You don't need this for protection",
      because,
      insteadDoThis: ["Fill your 401(k) and IRA first — there are no insurance costs in those at all."],
      suggestedMonthlyLow, suggestedMonthlyHigh,
    };
  }

  if (h.maxedTaxAdvantaged) {
    because.push("You've already filled your 401(k) and IRA, so you've run out of the obvious tax-free room. This is the situation it's built for.");
  }
  if (h.annualIncome >= 150_000) {
    because.push(`At ${fmtUsd(h.annualIncome)} of income, tax on your investment growth is a real cost — and growth in here isn't taxed.`);
  }
  if (analysis.recommendedPermanentFace > 0) {
    because.push(`You have ${fmtUsd(analysis.recommendedPermanentFace)} of protection need that doesn't expire, and term can't cover it because term does.`);
  }
  if (h.retirementAge - h.age >= 20) {
    because.push(`With ${h.retirementAge - h.age} years before retirement, there's plenty of time for the early costs to be outweighed.`);
  }
  if (h.numChildren > 0) {
    because.push("Money in here doesn't count as income when it comes out, which matters for financial aid.");
  }

  const strong = h.maxedTaxAdvantaged || h.annualIncome >= 150_000;
  if (!strong) {
    because.push("You still have room in your 401(k) and IRA — fill those first, then this becomes the natural next step.");
    return {
      helps: true,
      status: "worth_considering",
      headline: "Worth considering, once the simpler accounts are full",
      because,
      insteadDoThis: ["Max out your 401(k) and IRA first — no insurance costs at all in those."],
      suggestedMonthlyLow, suggestedMonthlyHigh,
    };
  }

  return {
    helps: true,
    status: "good_fit",
    headline: "Yes — this fits your situation well",
    because,
    insteadDoThis: [],
    suggestedMonthlyLow, suggestedMonthlyHigh,
  };
}

// ─── Suitability ──────────────────────────────────────────────────────────────

export interface SuitabilityInput {
  age: number;
  annualIncome: number;
  monthlyBudget: number;
  emergencyMonths: number;
  highInterestDebt: boolean;
  employerMatchCaptured: boolean;
  incomeStability: "stable" | "variable" | "uncertain";
  horizonYears: number;
  canSustainIncomeDrop: boolean;
  maxedTaxAdvantaged: boolean;
}

export interface SuitabilityFinding {
  id: string;
  severity: "blocker" | "caution" | "strength";
  title: string;
  detail: string;
}

export interface SuitabilityResult {
  verdict: "not_yet" | "conditional" | "good_fit";
  score: number;
  findings: SuitabilityFinding[];
  /** What to do first if IUL isn't the right next move. */
  betterFirstSteps: string[];
}

/**
 * Screens people OUT before the product is discussed. A tool that will say no
 * is the only kind whose yes means anything — and it keeps unsuitable business
 * off the books.
 */
export function scoreSuitability(input: SuitabilityInput): SuitabilityResult {
  const findings: SuitabilityFinding[] = [];
  const betterFirstSteps: string[] = [];

  if (input.emergencyMonths < 3) {
    findings.push({
      id: "emergency_fund",
      severity: "blocker",
      title: "No emergency fund yet",
      detail: "IUL is a long-term commitment with surrender charges for a decade or more. Cash you might need next year should not be in it.",
    });
    betterFirstSteps.push("Build three to six months of expenses in a high-yield savings account.");
  } else {
    findings.push({
      id: "emergency_fund",
      severity: "strength",
      title: `${input.emergencyMonths} months of reserves`,
      detail: "You can leave the policy alone through a rough patch, which is exactly what it needs.",
    });
  }

  if (input.highInterestDebt) {
    findings.push({
      id: "high_interest_debt",
      severity: "blocker",
      title: "High-interest debt outstanding",
      detail: "Paying off a 22% credit card is a guaranteed 22% return. No policy can beat that.",
    });
    betterFirstSteps.push("Clear high-interest debt first — it is the highest guaranteed return available to you.");
  }

  if (!input.employerMatchCaptured) {
    findings.push({
      id: "employer_match",
      severity: "blocker",
      title: "Employer match left on the table",
      detail: "A 50% match is an instant 50% return. Capture it before funding anything else.",
    });
    betterFirstSteps.push("Contribute at least enough to your 401(k) to capture the full employer match.");
  }

  if (input.horizonYears < 10) {
    findings.push({
      id: "horizon",
      severity: "blocker",
      title: "Horizon under ten years",
      detail: "Charges are front-loaded. Below roughly ten years you are very likely to get out with less than you put in.",
    });
    betterFirstSteps.push("For goals inside ten years, use a brokerage account or CDs — not permanent life insurance.");
  }

  if (input.incomeStability === "uncertain") {
    findings.push({
      id: "income_stability",
      severity: "blocker",
      title: "Income is uncertain right now",
      detail: "An underfunded IUL is the single most common way these policies fail. Fund it only from income you can count on.",
    });
    betterFirstSteps.push("Revisit this once your income has been steady for a year.");
  } else if (input.incomeStability === "variable") {
    findings.push({
      id: "income_stability",
      severity: "caution",
      title: "Variable income",
      detail: "Workable, but size the premium to your worst year, not your best. Overfunding later is easy; catching up is not.",
    });
  }

  if (!input.canSustainIncomeDrop) {
    findings.push({
      id: "stress_affordability",
      severity: "caution",
      title: "The premium is a stretch",
      detail: "You said you could not keep this up if your income fell 30%. That is the signal to fund a smaller policy, not to skip it.",
    });
  }

  if (!input.maxedTaxAdvantaged) {
    findings.push({
      id: "tax_advantaged",
      severity: "caution",
      title: "Roth / 401(k) room still unused",
      detail: "Those have no insurance charges at all. Fill them first unless you specifically need the death benefit or the access rules.",
    });
  } else {
    findings.push({
      id: "tax_advantaged",
      severity: "strength",
      title: "Tax-advantaged accounts already maxed",
      detail: "This is the classic case for IUL — you have run out of Roth room and still want tax-free growth and access.",
    });
  }

  const budgetRatio = input.annualIncome > 0 ? (input.monthlyBudget * 12) / input.annualIncome : 0;
  if (budgetRatio > 0.25) {
    findings.push({
      id: "budget_ratio",
      severity: "caution",
      title: "Premium is a large share of income",
      detail: `At ${Math.round(budgetRatio * 100)}% of gross income this is more than most people sustain for twenty years.`,
    });
  }

  if (input.age > 60) {
    findings.push({
      id: "age",
      severity: "caution",
      title: "Starting after 60",
      detail: "Cost of insurance rises steeply from here, so less of each dollar reaches the cash value. It can still work, but the design has to be tighter.",
    });
  }

  const blockers = findings.filter((f) => f.severity === "blocker").length;
  const cautions = findings.filter((f) => f.severity === "caution").length;
  const strengths = findings.filter((f) => f.severity === "strength").length;

  const score = Math.max(0, Math.min(100, 70 - blockers * 30 - cautions * 10 + strengths * 12));
  const verdict: SuitabilityResult["verdict"] =
    blockers > 0 ? "not_yet" : cautions > 1 ? "conditional" : "good_fit";

  return { verdict, score, findings, betterFirstSteps };
}

// ─── Formatting helpers shared by the UI ──────────────────────────────────────

export function fmtUsd(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 2)}M`;
  if (abs >= 10_000) return `${sign}$${Math.round(abs / 1000)}K`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}K`;
  return `${sign}$${Math.round(abs)}`;
}

export function fmtUsdExact(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}
