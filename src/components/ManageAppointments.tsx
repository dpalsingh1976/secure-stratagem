import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Clock, Mail, Loader2, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  event_date: string;
  event_time: string;
  special_requests: string | null;
  status: string;
}

interface ManageAppointmentsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManageAppointments = ({ open, onOpenChange }: ManageAppointmentsProps) => {
  const [email, setEmail] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [rescheduleDialog, setRescheduleDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newTime, setNewTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());

  const fetchAppointments = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: {
          action: 'get-by-email',
          appointmentData: { email }
        }
      });

      if (error) throw error;

      if (data?.success) {
        setAppointments(data.appointments);
        if (data.appointments.length === 0) {
          toast.info('No appointments found for this email');
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: { action: 'get-availability' }
      });

      if (error) throw error;

      if (data?.success) {
        setBookedSlots(new Set(data.bookedSlots));
        setAvailableSlots(data.availableSlots);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const handleReschedule = async () => {
    if (!selectedAppointment || !newDate || !newTime) {
      toast.error('Please select a new date and time');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: {
          action: 'reschedule',
          appointmentId: selectedAppointment.id,
          appointmentData: {
            eventDate: format(newDate, 'yyyy-MM-dd'),
            eventTime: newTime
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Appointment rescheduled successfully!');
        setRescheduleDialog(false);
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error rescheduling:', error);
      toast.error('Failed to reschedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: {
          action: 'cancel',
          appointmentId
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Appointment cancelled successfully');
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error cancelling:', error);
      toast.error('Failed to cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  const openRescheduleDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleDialog(true);
    fetchAvailability();
  };

  const isTimeSlotAvailable = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slotKey = `${dateStr}_${time}`;
    return !bookedSlots.has(slotKey);
  };

  const disabledDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = date.getDay();
    return date < today || day === 0 || day === 6;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading">Manage Your Appointments</DialogTitle>
            <DialogDescription>
              View, reschedule, or cancel your scheduled appointments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Enter your email to view appointments</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchAppointments()}
                />
                <Button onClick={fetchAppointments} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {appointments.length > 0 && (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <p className="font-semibold text-lg">{appointment.customer_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(appointment.event_date), 'EEEE, MMMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {appointment.event_time}
                          </div>
                          {appointment.special_requests && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Notes: {appointment.special_requests}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRescheduleDialog(appointment)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancel(appointment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialog} onOpenChange={setRescheduleDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time for your appointment
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <CalendarComponent
                mode="single"
                selected={newDate}
                onSelect={setNewDate}
                disabled={disabledDates}
                className="rounded-md border"
              />
            </div>

            {newDate && (
              <div className="space-y-2">
                <Label>Available Time Slots</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.map((time) => {
                    const available = isTimeSlotAvailable(newDate, time);
                    return (
                      <Button
                        key={time}
                        variant={newTime === time ? "default" : "outline"}
                        disabled={!available}
                        onClick={() => setNewTime(time)}
                        className="w-full"
                      >
                        {time}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleReschedule}
            disabled={!newDate || !newTime || loading}
            className="w-full mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Rescheduling...
              </>
            ) : (
              'Confirm Reschedule'
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ManageAppointments;
