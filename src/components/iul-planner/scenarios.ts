import type { LifeEvent } from "@/lib/iul-planner/engine";

/**
 * The scenario deck. Each card is something that can actually happen to a
 * family. The client picks the age it happens at, and the numbers on the right
 * move — which is the point: when something happens matters as much as what.
 *
 * Copy is deliberately plain. No policy vocabulary on the card face.
 */
export interface ScenarioCard {
  id: string;
  label: string;
  icon: string;
  blurb: string;
  defaultAgeOffset: number;
  minAgeOffset: number;
  maxAgeOffset: number;
  /** What this plan does for them. */
  whatHappens: string;
  /** The honest limit. Shown under "worth knowing", not as a warning banner. */
  worthKnowing: string;
  build: (age: number) => LifeEvent[];
}

export const SCENARIO_DECK: ScenarioCard[] = [
  {
    id: "job_loss",
    label: "I lose my job",
    icon: "briefcase",
    blurb: "Income stops for a couple of years.",
    defaultAgeOffset: 7,
    minAgeOffset: 1,
    maxAgeOffset: 25,
    whatHappens:
      "You can stop paying for a while and the plan keeps running on the money you've already built up. When you're back on your feet, you start again. Nothing is cancelled and nothing is lost.",
    worthKnowing:
      "The money it uses to keep itself going comes out of your balance, so a long pause sets you back. Short pauses are easy to recover from.",
    build: (age) => [{ kind: "premium_holiday", atAge: age, years: 2 }],
  },
  {
    id: "retire_into_crash",
    label: "The market crashes right when I retire",
    icon: "trending-down",
    blurb: "A 40% drop, the year you start taking income.",
    defaultAgeOffset: 27,
    minAgeOffset: 15,
    maxAgeOffset: 40,
    whatHappens:
      "Your balance doesn't fall. You take your income from money that didn't drop, so you're not cashing things in at the worst possible moment. This is the single biggest risk to a retirement, and it's the thing this handles best.",
    worthKnowing:
      "The same protection means that in a big recovery year you earn your cap rather than the full run-up.",
    build: (age) => [{ kind: "market_shock", atAge: age, returnPct: -40 }],
  },
  {
    id: "chronic_illness",
    label: "I get seriously ill",
    icon: "heart-pulse",
    blurb: "Long-term care, in your sixties.",
    defaultAgeOffset: 24,
    minAgeOffset: 10,
    maxAgeOffset: 45,
    whatHappens:
      "You can take a large part of your family's payout early, tax-free, and use it for your own care while you're alive. No claim on your savings, no selling anything.",
    worthKnowing:
      "Whatever you use for care comes out of what your family receives later.",
    build: (age) => [{ kind: "chronic_illness", atAge: age, accelerateFraction: 0.25 }],
  },
  {
    id: "business",
    label: "I want to start something",
    icon: "rocket",
    blurb: "$60,000 of capital, in your fifties.",
    defaultAgeOffset: 17,
    minAgeOffset: 5,
    maxAgeOffset: 35,
    whatHappens:
      "You borrow it from your own plan. No application, no credit check, no tax bill, and nothing gets sold. The money you borrow against keeps growing while it's out.",
    worthKnowing:
      "Borrowed money carries interest until you pay it back, and anything still outstanding comes off your family's payout.",
    build: (age) => [{ kind: "lump_need", atAge: age, amount: 60_000 }],
  },
  {
    id: "tuition",
    label: "College tuition arrives",
    icon: "graduation-cap",
    blurb: "$100,000, over a few years.",
    defaultAgeOffset: 14,
    minAgeOffset: 5,
    maxAgeOffset: 30,
    whatHappens:
      "You take it out without it counting as income — which matters, because income is what financial aid formulas look at hardest.",
    worthKnowing:
      "Money taken out in your fifties isn't there compounding in your seventies. Every withdrawal has a cost later.",
    build: (age) => [{ kind: "lump_need", atAge: age, amount: 100_000 }],
  },
  {
    id: "early_death",
    label: "Something happens to me",
    icon: "shield",
    blurb: "The one nobody wants to think about.",
    defaultAgeOffset: 20,
    minAgeOffset: 2,
    maxAgeOffset: 50,
    whatHappens:
      "Your family gets the full amount, tax-free, within weeks — no matter how little you'd managed to save by then, and no matter what the market is doing.",
    worthKnowing:
      "This is what insurance is for. If it's the only part you care about, term insurance alone may be the better buy.",
    build: (age) => [{ kind: "death", atAge: age }],
  },
  {
    id: "long_life",
    label: "I live well into my nineties",
    icon: "hourglass",
    blurb: "Living longer than the money was meant to last.",
    defaultAgeOffset: 40,
    minAgeOffset: 30,
    maxAgeOffset: 55,
    whatHappens:
      "The protection never expires and the income keeps coming, as long as the plan was funded well enough to carry itself.",
    worthKnowing:
      "The cost of protection climbs steeply after 80, so a thinly funded plan can struggle late. Funding it properly early is what prevents that.",
    build: () => [],
  },
];

export const SCENARIO_BY_ID = Object.fromEntries(SCENARIO_DECK.map((s) => [s.id, s]));
