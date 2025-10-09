import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Mail, Phone, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  event_date: string;
  event_time: string;
  status: string;
  special_requests: string | null;
  created_at: string;
}

export const AppointmentsManager = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading appointments',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Status updated',
        description: `Appointment marked as ${newStatus}`,
      });

      fetchAppointments();
    } catch (error: any) {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      confirmed: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Appointments Overview</h3>
          <p className="text-sm text-muted-foreground">
            {appointments.length} total appointment{appointments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={fetchAppointments} variant="outline">
          Refresh
        </Button>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No appointments scheduled yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(apt.event_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{apt.event_time}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{apt.customer_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{apt.customer_email}</span>
                        </div>
                        {apt.customer_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{apt.customer_phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(apt.status)}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm text-muted-foreground truncate">
                          {apt.special_requests || 'None'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {apt.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(apt.id, 'confirmed')}
                          >
                            Confirm
                          </Button>
                        )}
                        {apt.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(apt.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                        {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatus(apt.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
