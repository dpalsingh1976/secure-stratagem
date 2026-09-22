import { Ban, HeartPulse, Shield, Snowflake, TrendingUp, Unlock } from "lucide-react";

/**
 * The value story, shown underneath the client's own numbers once the risk has
 * been worked out. It is deliberately NOT shown during the discovery questions:
 * there is no result to attach it to yet, and a panel of claims beside a form
 * reads as a brochure rather than an answer.
 */

export interface Benefit {
  id: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
}

export const BENEFITS: Benefit[] = [
  {
    id: "floor",
    icon: <Snowflake className="h-4 w-4" />,
    title: "Your money doesn't go backwards",
    detail: "When the market falls, your balance stays where it is. You earn nothing that year instead of losing.",
  },
  {
    id: "growth",
    icon: <TrendingUp className="h-4 w-4" />,
    title: "It still grows in the good years",
    detail: "Your balance follows the market upward, up to a limit set each year.",
  },
  {
    id: "protection",
    icon: <Shield className="h-4 w-4" />,
    title: "Your family is covered from day one",
    detail: "Not after it builds up — from your very first payment, paid to them tax-free.",
  },
  {
    id: "access",
    icon: <Unlock className="h-4 w-4" />,
    title: "You can reach it without tax or penalties",
    detail: "No waiting until 59½, no credit check, no paperwork, and nothing has to be sold.",
  },
  {
    id: "illness",
    icon: <HeartPulse className="h-4 w-4" />,
    title: "It pays you if you become seriously ill",
    detail: "You can take money out early for your own care, while you're alive and need it.",
  },
  {
    id: "limits",
    icon: <Ban className="h-4 w-4" />,
    title: "No yearly contribution limit",
    detail: "Unlike a 401(k) or an IRA, there's no cap on how much you're allowed to put in.",
  },
];

/** Compact list used underneath the numbers once a budget exists. */
export function BenefitsList({ benefits = BENEFITS }: { benefits?: Benefit[] }) {
  return (
    <ul className="space-y-2.5">
      {benefits.map((b) => (
        <li key={b.id} className="flex gap-2.5">
          <span className="mt-0.5 rounded-lg bg-teal-50 p-1.5 text-teal-600">{b.icon}</span>
          <span>
            <span className="block text-sm font-medium leading-snug text-slate-800">{b.title}</span>
            <span className="mt-0.5 block text-xs leading-snug text-slate-500">{b.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
