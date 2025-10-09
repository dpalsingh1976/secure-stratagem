import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { action, appointmentData, appointmentId } = await req.json();
    console.log('Appointment action:', action, appointmentData);

    switch (action) {
      case 'create': {
        const { error } = await supabaseClient
          .from('appointments')
          .insert({
            customer_name: appointmentData.customerName,
            customer_email: appointmentData.customerEmail,
            customer_phone: appointmentData.customerPhone,
            event_date: appointmentData.eventDate,
            event_time: appointmentData.eventTime,
            event_type: 'consultation',
            special_requests: appointmentData.notes || null,
            status: 'pending'
          });

        if (error) throw error;

        // Send email notification to advisor
        await resend.emails.send({
          from: "Appointments <onboarding@resend.dev>",
          to: ["davindes@theprosperityfinancial.com"],
          subject: `New Strategy Session Booked - ${appointmentData.customerName}`,
          html: `
            <h2>New Appointment Booked</h2>
            <p><strong>Client:</strong> ${appointmentData.customerName}</p>
            <p><strong>Email:</strong> ${appointmentData.customerEmail}</p>
            <p><strong>Phone:</strong> ${appointmentData.customerPhone || 'Not provided'}</p>
            <p><strong>Date:</strong> ${appointmentData.eventDate}</p>
            <p><strong>Time:</strong> ${appointmentData.eventTime}</p>
            ${appointmentData.notes ? `<p><strong>Notes:</strong> ${appointmentData.notes}</p>` : ''}
          `,
        });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      case 'reschedule': {
        const { data, error } = await supabaseClient
          .from('appointments')
          .update({
            event_date: appointmentData.eventDate,
            event_time: appointmentData.eventTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', appointmentId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, appointment: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      case 'cancel': {
        const { data, error } = await supabaseClient
          .from('appointments')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', appointmentId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, appointment: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      case 'get-availability': {
        // Get appointments for the next 30 days
        const today = new Date().toISOString().split('T')[0];
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        const end = endDate.toISOString().split('T')[0];

        const { data, error } = await supabaseClient
          .from('appointments')
          .select('event_date, event_time')
          .gte('event_date', today)
          .lte('event_date', end)
          .neq('status', 'cancelled');

        if (error) throw error;

        // Define available time slots (9 AM - 5 PM, every hour)
        const availableSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
        
        // Create availability map
        const bookedSlots = new Set(
          data.map(apt => `${apt.event_date}_${apt.event_time}`)
        );

        return new Response(
          JSON.stringify({ success: true, bookedSlots: Array.from(bookedSlots), availableSlots }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      case 'get-by-email': {
        const { data, error } = await supabaseClient
          .from('appointments')
          .select('*')
          .eq('customer_email', appointmentData.email)
          .neq('status', 'cancelled')
          .order('event_date', { ascending: true });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, appointments: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
