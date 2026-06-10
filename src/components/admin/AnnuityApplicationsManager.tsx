import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type AnnuityApp = Record<string, any>;
type Beneficiary = Record<string, any>;
type Allocation = Record<string, any>;

const ENCRYPTED_FIELDS = new Set(['ssn_tin', 'id_document_number']);
const HIDDEN_FIELDS = new Set(['id', 'created_at', 'updated_at']);

function formatLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (ENCRYPTED_FIELDS.has(key)) return '[encrypted — retrieve via admin tool]';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function AnnuityApplicationsManager() {
  const [apps, setApps] = useState<AnnuityApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AnnuityApp | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any)
        .from('annuity_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setApps(data);
      setLoading(false);
    })();
  }, []);

  const openDetails = async (app: AnnuityApp) => {
    setSelected(app);
    setDetailLoading(true);
    const [b, a] = await Promise.all([
      (supabase as any).from('application_beneficiaries').select('*').eq('application_id', app.id),
      (supabase as any).from('application_allocations').select('*').eq('application_id', app.id),
    ]);
    setBeneficiaries(b.data ?? []);
    setAllocations(a.data ?? []);
    setDetailLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submission Date</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Ownership Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No annuity applications yet.
              </TableCell>
            </TableRow>
          ) : (
            apps.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.client_name ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={app.status === 'submitted' ? 'default' : 'secondary'}>
                    {app.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell>{app.email ?? '—'}</TableCell>
                <TableCell>{app.ownership_type ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => openDetails(app)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>
              {selected?.client_name ?? 'Application'} — Annuity Application
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="beneficiaries">
                  Beneficiaries ({beneficiaries.length})
                </TabsTrigger>
                <TabsTrigger value="allocations">
                  Allocations ({allocations.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <ScrollArea className="h-[60vh] pr-4">
                  <Card>
                    <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      {Object.entries(selected)
                        .filter(([k]) => !HIDDEN_FIELDS.has(k))
                        .map(([k, v]) => (
                          <div key={k} className="text-sm">
                            <div className="text-muted-foreground text-xs">{formatLabel(k)}</div>
                            <div className="break-words">{formatValue(k, v)}</div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="beneficiaries">
                <ScrollArea className="h-[60vh] pr-4">
                  {detailLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : beneficiaries.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No beneficiaries on file.</p>
                  ) : (
                    <div className="space-y-3">
                      {beneficiaries.map((b) => (
                        <Card key={b.id}>
                          <CardContent className="pt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            {Object.entries(b)
                              .filter(([k]) => !HIDDEN_FIELDS.has(k) && k !== 'application_id')
                              .map(([k, v]) => (
                                <div key={k}>
                                  <div className="text-muted-foreground text-xs">{formatLabel(k)}</div>
                                  <div>{formatValue(k, v)}</div>
                                </div>
                              ))}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="allocations">
                <ScrollArea className="h-[60vh] pr-4">
                  {detailLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : allocations.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No allocations on file.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Crediting Method</TableHead>
                          <TableHead>Index Option</TableHead>
                          <TableHead className="text-right">Allocation %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allocations.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell>{a.crediting_method}</TableCell>
                            <TableCell>{a.index_option}</TableCell>
                            <TableCell className="text-right">{a.allocation_percentage}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
