import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface BookingCalendarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BookingCalendar = ({ open, onOpenChange }: BookingCalendarProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  console.log('BookingCalendar rendered, open:', open);

  const fetchAvailability = async () => {
    try {
      console.log('Fetching availability...');
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: { action: 'get-availability' }
      });

      console.log('Availability response:', { data, error });

      if (error) {
        console.error('Availability error:', error);
        toast.error('Failed to fetch available time slots');
        throw error;
      }

      if (data?.success) {
        setBookedSlots(new Set(data.bookedSlots || []));
        setAvailableSlots(data.availableSlots || []);
        console.log('Available slots:', data.availableSlots);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Unable to load booking calendar. Please try again.');
    }
  };

  // Fetch availability when dialog opens
  useEffect(() => {
    console.log('useEffect triggered, open:', open);
    if (open) {
      console.log('Calling fetchAvailability...');
      fetchAvailability();
    }
  }, [open]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime("");
    if (date) {
      fetchAvailability();
    }
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

  const handleSubmit = async () => {
    if (!name || !email || !selectedDate || !selectedTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Booking appointment:', {
        name,
        email,
        phone,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime
      });

      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: {
          action: 'create',
          appointmentData: {
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            eventDate: format(selectedDate, 'yyyy-MM-dd'),
            eventTime: selectedTime,
            notes: notes
          }
        }
      });

      console.log('Booking response:', { data, error });

      if (error) {
        console.error('Booking error:', error);
        throw error;
      }

      if (data?.success) {
        toast.success('Appointment booked successfully! We will contact you shortly.');
        onOpenChange(false);
        // Reset form
        setName("");
        setEmail("");
        setPhone("");
        setNotes("");
        setSelectedDate(undefined);
        setSelectedTime("");
      } else {
        throw new Error('Booking failed');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment. Please try again or contact us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">Book Your Free Strategy Session</DialogTitle>
          <DialogDescription>
            Schedule a complimentary consultation with our financial professionals
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Special Requests or Topics to Discuss</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Let us know what you'd like to discuss..."
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Date *</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={disabledDates}
                className="rounded-md border"
              />
            </div>

            {selectedDate && (
              <div className="space-y-2">
                <Label>Available Time Slots *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.map((time) => {
                    const available = isTimeSlotAvailable(selectedDate, time);
                    return (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        disabled={!available}
                        onClick={() => setSelectedTime(time)}
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
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!name || !email || !selectedDate || !selectedTime || loading}
          className="w-full mt-4"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Booking...
            </>
          ) : (
            'Book Strategy Session'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default BookingCalendar;
