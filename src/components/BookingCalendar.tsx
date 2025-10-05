import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BookingCalendarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BookingCalendar = ({ open, onOpenChange }: BookingCalendarProps) => {
  useEffect(() => {
    // Load Calendly widget script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl font-heading">Book Your Free Strategy Session</DialogTitle>
          <DialogDescription>
            Schedule a complimentary consultation with our financial professionals
          </DialogDescription>
        </DialogHeader>
        
        <div className="h-[700px] w-full">
          <div 
            className="calendly-inline-widget h-full w-full" 
            data-url="https://calendly.com/theprosperityfinancial"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingCalendar;
