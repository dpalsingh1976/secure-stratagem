import { HelpCircle, Check, X, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScorecardItem } from "@/types/plan529VsIul";

interface ComparisonTableProps {
  scorecardItems: ScorecardItem[];
}

function WinnerIcon({ winner }: { winner: '529' | 'IUL' | 'tie' }) {
  switch (winner) {
    case '529':
      return <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    case 'IUL':
      return <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    case 'tie':
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

export function ComparisonTable({ scorecardItems }: ComparisonTableProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Side-by-Side Scorecard</h3>
      <p className="text-sm text-muted-foreground">
        Compare key characteristics of each savings vehicle.
      </p>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[200px]">Category</TableHead>
              <TableHead className="text-center bg-blue-50/50 dark:bg-blue-900/20">
                <span className="text-blue-700 dark:text-blue-300 font-semibold">529 Plan</span>
              </TableHead>
              <TableHead className="text-center bg-emerald-50/50 dark:bg-emerald-900/20">
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">IUL</span>
              </TableHead>
              <TableHead className="w-[80px] text-center">Winner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scorecardItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {item.category}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{item.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
                <TableCell className="text-center bg-blue-50/30 dark:bg-blue-900/10">
                  <span className="text-sm">{item.label529}</span>
                </TableCell>
                <TableCell className="text-center bg-emerald-50/30 dark:bg-emerald-900/10">
                  <span className="text-sm">{item.labelIul}</span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <WinnerIcon winner={item.winner} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Generate scorecard items based on inputs
export function generateScorecardItems(): ScorecardItem[] {
  return [
    {
      category: 'Best for Education',
      label529: 'Tax-free growth + withdrawals',
      labelIul: 'Tax-free loans (if designed well)',
      winner: '529',
      tooltip: '529 plans offer straightforward tax-free treatment for qualified education expenses.',
    },
    {
      category: 'Best for Flexibility',
      label529: 'Limited to education use',
      labelIul: 'Any purpose via loans',
      winner: 'IUL',
      tooltip: 'IUL allows tax-free access for any purpose, while 529 penalizes non-education use.',
    },
    {
      category: 'Penalty Risk',
      label529: '10% + taxes on earnings',
      labelIul: 'None (if loans managed)',
      winner: 'IUL',
      tooltip: '529 non-qualified withdrawals face taxes and penalties. IUL has no withdrawal penalties.',
    },
    {
      category: 'Setup Complexity',
      label529: 'Simple—open online',
      labelIul: 'Complex—underwriting required',
      winner: '529',
      tooltip: '529 is easy to open. IUL requires medical underwriting and careful policy design.',
    },
    {
      category: 'Liquidity/Access',
      label529: 'Restricted to education',
      labelIul: 'Flexible via policy loans',
      winner: 'IUL',
      tooltip: 'IUL provides flexible access to funds. 529 restricts access to qualified expenses.',
    },
    {
      category: 'Legacy Value',
      label529: 'Account balance only',
      labelIul: 'Death benefit included',
      winner: 'IUL',
      tooltip: 'IUL includes a death benefit. 529 only passes the account balance to beneficiaries.',
    },
    {
      category: 'State Tax Benefits',
      label529: 'Often available',
      labelIul: 'Generally none',
      winner: '529',
      tooltip: 'Many states offer tax deductions or credits for 529 contributions.',
    },
    {
      category: 'Investment Control',
      label529: 'Limited fund options',
      labelIul: 'Index-linked strategies',
      winner: 'tie',
      tooltip: 'Both offer limited but distinct investment approaches.',
    },
  ];
}
