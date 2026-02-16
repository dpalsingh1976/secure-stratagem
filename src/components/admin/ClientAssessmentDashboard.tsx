import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Users, User, TrendingUp, Target, ShieldAlert, Loader2, AlertCircle } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

// ── Types ──────────────────────────────────────────────────────
interface ClientRow {
  id: string;
  name_first: string;
  name_last: string;
  email: string | null;
  phone: string | null;
  dob: string;
  state: string;
  filing_status: string;
  household_jsonb: Json | null;
  created_at: string | null;
  computed_metrics: {
    net_worth: number | null;
    scores_jsonb: Json | null;
    dime_need: number | null;
    protection_gap: number | null;
    retirement_gap_mo: number | null;
    tax_bucket_now_pct: number | null;
    tax_bucket_later_pct: number | null;
    tax_bucket_never_pct: number | null;
    liquid_pct: number | null;
    top_concentration_pct: number | null;
    liquidity_runway_months: number | null;
    disability_gap: number | null;
    ltc_gap: number | null;
    seq_risk_index: number | null;
    lifetime_tax_drag_est: number | null;
  } | null;
  financial_profile: {
    income_jsonb: Json | null;
    expenses_jsonb: Json | null;
    goals_jsonb: Json | null;
    preferences_jsonb: Json | null;
  } | null;
}

interface AssetRow {
  id: string;
  asset_type: string;
  title: string;
  current_value: number;
  tax_wrapper: string;
}

interface LiabilityRow {
  id: string;
  type: string;
  balance: number;
  rate: number;
  payment_monthly: number;
}

interface InsuranceRow {
  id: string;
  policy_type: string;
  face_amount: number | null;
  premium: number | null;
  carrier: string | null;
}

// ── Helpers ────────────────────────────────────────────────────
const calcAge = (dob: string) => {
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
};

const fmt = (n: number | null | undefined) => {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
};

const pct = (n: number | null | undefined) => (n != null ? `${Math.round(n)}%` : '—');

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const scoreBg = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

const riskLabel = (score: number) => {
  if (score >= 80) return 'Low Risk';
  if (score >= 60) return 'Medium Risk';
  return 'High Risk';
};

const getOverallScore = (metrics: ClientRow['computed_metrics']): number | null => {
  if (!metrics?.scores_jsonb) return null;
  const s = metrics.scores_jsonb as Record<string, unknown>;
  return typeof s.overall === 'number' ? s.overall : null;
};

const formatType = (t: string) => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// ── Sub-components ─────────────────────────────────────────────

function SummaryStats({ clients }: { clients: ClientRow[] }) {
  const total = clients.length;
  const assessed = clients.filter(c => getOverallScore(c.computed_metrics) != null).length;
  const pending = total - assessed;
  const scores = clients.map(c => getOverallScore(c.computed_metrics)).filter((s): s is number => s != null);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Total Clients', value: total, icon: Users },
        { label: 'Assessed', value: assessed, icon: ShieldAlert },
        { label: 'Pending', value: pending, icon: AlertCircle },
        { label: 'Avg Score', value: avgScore, icon: Target },
      ].map(({ label, value, icon: Icon }) => (
        <Card key={label} className="bg-card/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PersonalTab({ client }: { client: ClientRow }) {
  const household = client.household_jsonb as Record<string, unknown> | null;
  const dependents = household?.dependents ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[
        { label: 'Full Name', value: `${client.name_first} ${client.name_last}` },
        { label: 'Email', value: client.email || '—' },
        { label: 'Date of Birth', value: new Date(client.dob).toLocaleDateString() },
        { label: 'Age', value: calcAge(client.dob) },
        { label: 'State', value: client.state },
        { label: 'Filing Status', value: formatType(client.filing_status) },
        { label: 'Dependents', value: String(dependents) },
        { label: 'Client Since', value: client.created_at ? new Date(client.created_at).toLocaleDateString() : '—' },
      ].map(({ label, value }) => (
        <div key={label} className="bg-muted/40 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="font-medium">{value}</p>
        </div>
      ))}
    </div>
  );
}

function InvestmentsTab({ clientId, metrics }: { clientId: string; metrics: ClientRow['computed_metrics'] }) {
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [liabilities, setLiabilities] = useState<LiabilityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [a, l] = await Promise.all([
        supabase.from('assets').select('id, asset_type, title, current_value, tax_wrapper').eq('client_id', clientId),
        supabase.from('liabilities').select('id, type, balance, rate, payment_monthly').eq('client_id', clientId),
      ]);
      setAssets((a.data as AssetRow[]) || []);
      setLiabilities((l.data as LiabilityRow[]) || []);
      setLoading(false);
    };
    load();
  }, [clientId]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const totalAssets = assets.reduce((s, a) => s + a.current_value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.balance, 0);

  return (
    <div className="space-y-6">
      {/* Net Worth & Tax Buckets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-muted/40 border-0">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Net Worth</p>
            <p className="text-xl font-bold">{fmt(metrics?.net_worth)}</p>
          </CardContent>
        </Card>
        {[
          { label: 'Tax Now', value: metrics?.tax_bucket_now_pct },
          { label: 'Tax Later', value: metrics?.tax_bucket_later_pct },
          { label: 'Tax Never', value: metrics?.tax_bucket_never_pct },
        ].map(({ label, value }) => (
          <Card key={label} className="bg-muted/40 border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold">{pct(value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assets */}
      <div>
        <h4 className="font-semibold mb-2">Assets ({assets.length}) — {fmt(totalAssets)}</h4>
        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assets recorded.</p>
        ) : (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Tax Wrapper</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{formatType(a.asset_type)}</Badge></TableCell>
                    <TableCell className="text-right">{fmt(a.current_value)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{a.tax_wrapper.replace('TAX_', '')}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Liabilities */}
      <div>
        <h4 className="font-semibold mb-2">Liabilities ({liabilities.length}) — {fmt(totalLiabilities)}</h4>
        {liabilities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No liabilities recorded.</p>
        ) : (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Monthly Pmt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liabilities.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{formatType(l.type)}</TableCell>
                    <TableCell className="text-right">{fmt(l.balance)}</TableCell>
                    <TableCell className="text-right">{l.rate}%</TableCell>
                    <TableCell className="text-right">{fmt(l.payment_monthly)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function RetirementTab({ profile, metrics }: { profile: ClientRow['financial_profile']; metrics: ClientRow['computed_metrics'] }) {
  const goals = (profile?.goals_jsonb ?? {}) as Record<string, unknown>;
  const income = (profile?.income_jsonb ?? {}) as Record<string, unknown>;
  const prefs = (profile?.preferences_jsonb ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Target Retirement Age', value: goals.retirement_age ?? '—' },
          { label: 'Desired Monthly Income', value: fmt(Number(goals.desired_monthly_income) || 0) },
          { label: 'Lifestyle Preference', value: formatType(String(prefs.lifestyle ?? '—')) },
          { label: 'Risk Tolerance', value: prefs.risk_tolerance ?? '—' },
          { label: 'W2 / Salary Income', value: fmt(Number(income.w2_income) || 0) },
          { label: 'Social Security Est.', value: fmt(Number(income.social_security) || 0) },
          { label: 'Pension Est.', value: fmt(Number(income.pension) || 0) },
          { label: 'Other Income', value: fmt(Number(income.other_income) || 0) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="font-medium">{String(value)}</p>
          </div>
        ))}
      </div>

      {metrics?.retirement_gap_mo != null && (
        <Card className={`border-0 ${metrics.retirement_gap_mo > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Monthly Retirement Gap</p>
            <p className={`text-2xl font-bold ${metrics.retirement_gap_mo > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {fmt(metrics.retirement_gap_mo)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RiskAnalysisTab({ metrics, clientId }: { metrics: ClientRow['computed_metrics']; clientId: string }) {
  const [insurances, setInsurances] = useState<InsuranceRow[]>([]);

  useEffect(() => {
    supabase.from('insurances').select('id, policy_type, face_amount, premium, carrier').eq('client_id', clientId)
      .then(({ data }) => setInsurances((data as InsuranceRow[]) || []));
  }, [clientId]);

  if (!metrics) return <p className="text-muted-foreground text-center py-6">No risk analysis data available.</p>;

  const scores = (metrics.scores_jsonb ?? {}) as Record<string, number>;
  const overall = scores.overall ?? 0;

  const subScores = [
    { label: 'Protection', key: 'protection' },
    { label: 'Liquidity', key: 'liquidity' },
    { label: 'Concentration', key: 'concentration' },
    { label: 'Volatility', key: 'volatility' },
    { label: 'Longevity', key: 'longevity' },
    { label: 'Inflation', key: 'inflation' },
    { label: 'Tax Efficiency', key: 'tax' },
  ];

  const totalCoverage = insurances.reduce((s, i) => s + (i.face_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="flex flex-col items-center gap-2">
        <div className={`relative h-28 w-28 rounded-full border-8 ${scoreBg(overall)} border-opacity-20 flex items-center justify-center`}>
          <span className={`text-xl font-bold ${scoreColor(overall)}`}>{riskLabel(overall)}</span>
        </div>
        <p className="text-sm text-muted-foreground">Overall Risk Level</p>
      </div>

      {/* Sub-scores */}
      <div className="space-y-3">
        {subScores.map(({ label, key }) => {
          const val = scores[key] ?? 0;
          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span className={`font-semibold ${scoreColor(val)}`}>{val}</span>
              </div>
              <Progress value={val} className="h-2" />
            </div>
          );
        })}
      </div>

      {/* DIME & Protection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-muted/40 border-0">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">DIME Need</p>
            <p className="text-xl font-bold">{fmt(metrics.dime_need)}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/40 border-0">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Current Coverage</p>
            <p className="text-xl font-bold">{fmt(totalCoverage)}</p>
          </CardContent>
        </Card>
        <Card className={`border-0 ${(metrics.protection_gap ?? 0) > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Protection Gap</p>
            <p className={`text-xl font-bold ${(metrics.protection_gap ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {fmt(metrics.protection_gap)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted/40 border-0">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Liquidity Runway</p>
            <p className="text-xl font-bold">{metrics.liquidity_runway_months != null ? `${Math.round(metrics.liquidity_runway_months)} mo` : '—'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export function ClientAssessmentDashboard() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState('personal');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 5;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id, name_first, name_last, email, phone, dob, state, filing_status, household_jsonb, created_at,
          computed_metrics (net_worth, scores_jsonb, dime_need, protection_gap, retirement_gap_mo, tax_bucket_now_pct, tax_bucket_later_pct, tax_bucket_never_pct, liquid_pct, top_concentration_pct, liquidity_runway_months, disability_gap, ltc_gap, seq_risk_index, lifetime_tax_drag_est),
          financial_profile (income_jsonb, expenses_jsonb, goals_jsonb, preferences_jsonb)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Supabase returns one-to-one relations as objects or null
        const mapped = data.map((row: any) => ({
          ...row,
          computed_metrics: Array.isArray(row.computed_metrics) ? row.computed_metrics[0] ?? null : row.computed_metrics,
          financial_profile: Array.isArray(row.financial_profile) ? row.financial_profile[0] ?? null : row.financial_profile,
        })) as ClientRow[];
        setClients(mapped);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(c =>
      `${c.name_first} ${c.name_last}`.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  }, [clients, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);

  // Reset page when search changes
  useEffect(() => { setPage(0); }, [search]);

  const selected = useMemo(() => clients.find(c => c.id === selectedId) ?? null, [clients, selectedId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SummaryStats clients={clients} />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Client List */}
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {search ? 'No clients match your search.' : 'No clients found.'}
                </TableCell>
              </TableRow>
            ) : (
              paged.map(c => {
                const score = getOverallScore(c.computed_metrics);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name_first} {c.name_last}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{c.email || '—'}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{c.phone || '—'}</TableCell>
                    <TableCell>{c.state}</TableCell>
                    <TableCell>
                      {score != null ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`${scoreColor(score)} font-semibold px-2 py-1 h-auto`}
                          onClick={() => {
                            setSelectedId(selectedId === c.id ? null : c.id);
                            setDetailTab('personal');
                          }}
                        >
                          {riskLabel(score)}
                        </Button>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selected && (
        <Card className="border-primary/20 shadow-lg animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {selected.name_first} {selected.name_last}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={detailTab} onValueChange={setDetailTab}>
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="personal" className="text-xs sm:text-sm">
                  <User className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Personal
                </TabsTrigger>
                <TabsTrigger value="investments" className="text-xs sm:text-sm">
                  <TrendingUp className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Investments
                </TabsTrigger>
                <TabsTrigger value="retirement" className="text-xs sm:text-sm">
                  <Target className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Retirement
                </TabsTrigger>
                <TabsTrigger value="risk" className="text-xs sm:text-sm">
                  <ShieldAlert className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Risk
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <PersonalTab client={selected} />
              </TabsContent>
              <TabsContent value="investments">
                <InvestmentsTab clientId={selected.id} metrics={selected.computed_metrics} />
              </TabsContent>
              <TabsContent value="retirement">
                <RetirementTab profile={selected.financial_profile} metrics={selected.computed_metrics} />
              </TabsContent>
              <TabsContent value="risk">
                <RiskAnalysisTab metrics={selected.computed_metrics} clientId={selected.id} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
