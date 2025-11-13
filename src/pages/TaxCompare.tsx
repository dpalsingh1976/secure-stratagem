import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ComplianceFooter } from "@/components/tax/ComplianceFooter";
import { TaxKPI } from "@/components/tax/TaxKPI";
import { TaxChartCard } from "@/components/tax/TaxChartCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";

export default function TaxCompare() {
  const navigate = useNavigate();
  const [comparison, setComparison] = useState<any>(null);

  useEffect(() => {
    const results401k = JSON.parse(sessionStorage.getItem('tax_401k_results') || '{}');
    const resultsRoth = JSON.parse(sessionStorage.getItem('tax_roth_results') || '{}');
    
    if (results401k && resultsRoth) {
      setComparison({
        net_income_diff: resultsRoth.net_income - results401k.net_income,
        annual_tax_savings: results401k.total_annual_tax,
        lifetime_tax_diff_30: results401k.cum_tax_30,
        ssi_impact: results401k.ssi_tax_due,
        results401k,
        resultsRoth
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container-financial section-padding">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate('/tax-scenarios')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-4xl font-bold text-foreground">Side-by-Side Comparison</h1>
        </div>

        {comparison && (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <TaxKPI
                label="Net Income Advantage"
                value={comparison.net_income_diff}
                tooltip="Roth/LIRP vs 401(k)"
                highlight
                trend={comparison.net_income_diff > 0 ? 'up' : 'down'}
              />
              <TaxKPI
                label="Annual Tax Savings"
                value={comparison.annual_tax_savings}
                tooltip="Tax avoided with Roth/LIRP"
              />
              <TaxKPI
                label="30-Year Tax Difference"
                value={comparison.lifetime_tax_diff_30}
                tooltip="Lifetime savings"
              />
              <TaxKPI
                label="SSI Tax Impact"
                value={comparison.ssi_impact}
                tooltip="401(k) causes SSI taxation"
                highlight
              />
            </div>

            <TaxChartCard
              title="Annual Comparison"
              data={[
                { category: '401(k)', gross: comparison.results401k.gross_income, taxes: comparison.results401k.total_annual_tax, net: comparison.results401k.net_income },
                { category: 'Roth/LIRP', gross: comparison.resultsRoth.annual_tax_free_income, taxes: 0, net: comparison.resultsRoth.net_income }
              ]}
              chartType="bar"
              dataKeys={[
                { key: 'gross', name: 'Gross', color: 'hsl(var(--chart-1))' },
                { key: 'taxes', name: 'Taxes', color: 'hsl(var(--chart-2))' },
                { key: 'net', name: 'Net', color: 'hsl(var(--chart-3))' }
              ]}
            />

            <div className="flex gap-4 mt-8">
              <Button onClick={() => navigate('/tax-agent')}>Talk to AI Agent</Button>
              <Button variant="outline"><Download className="mr-2 h-4 w-4" />Export PDF</Button>
            </div>
          </>
        )}
      </div>

      <ComplianceFooter />
      <Footer />
    </div>
  );
}
