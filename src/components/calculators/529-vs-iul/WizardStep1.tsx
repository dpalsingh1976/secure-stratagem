import { GraduationCap, PiggyBank, Heart, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SavingsGoal } from "@/types/plan529VsIul";

interface WizardStep1Props {
  goals: SavingsGoal[];
  onGoalsChange: (goals: SavingsGoal[]) => void;
}

const GOAL_OPTIONS: { value: SavingsGoal; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: 'education',
    label: 'Child Education Funding',
    description: 'College, university, or vocational training',
    icon: GraduationCap,
  },
  {
    value: 'flex_savings',
    label: 'Flexible Savings',
    description: 'House down payment, wedding, business, emergencies',
    icon: PiggyBank,
  },
  {
    value: 'legacy',
    label: 'Legacy / Inheritance',
    description: 'Leave wealth for future generations',
    icon: Heart,
  },
  {
    value: 'retirement_supplement',
    label: 'Retirement Supplement',
    description: 'Additional flexibility for future needs',
    icon: TrendingUp,
  },
];

export function WizardStep1({ goals, onGoalsChange }: WizardStep1Props) {
  const handleGoalToggle = (goal: SavingsGoal) => {
    if (goals.includes(goal)) {
      onGoalsChange(goals.filter(g => g !== goal));
    } else {
      onGoalsChange([...goals, goal]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">What are you planning for?</h2>
        <p className="text-muted-foreground">
          Select all goals that apply. This helps us tailor the comparison.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {GOAL_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = goals.includes(option.value);

          return (
            <Card
              key={option.value}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleGoalToggle(option.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    id={option.value}
                    checked={isSelected}
                    onCheckedChange={() => handleGoalToggle(option.value)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <Label
                        htmlFor={option.value}
                        className={`font-medium cursor-pointer ${isSelected ? 'text-primary' : 'text-foreground'}`}
                      >
                        {option.label}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {goals.length === 0 && (
        <p className="text-center text-sm text-amber-600 dark:text-amber-400">
          Please select at least one goal to continue.
        </p>
      )}
    </div>
  );
}
