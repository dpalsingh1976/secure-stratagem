import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";
import { encode as b64encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Escape text safely for iCalendar fields
function icalEscape(s = "") {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

// Convert Date → iCalendar UTC format
function toICalUtc(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

// Generate iCalendar (.ics) file content
function generateICalendar(appointmentData: any): string {
  const { customerName, customerEmail, eventDate, eventTime, notes } = appointmentData;

  // Treat time as Eastern (approx -04:00 or -05:00)
  const startLocal = new Date(`${eventDate}T${eventTime}:00-04:00`);
  const endLocal = new Date(startLocal.getTime() + 60 * 60 * 1000);

  const dtstamp = toICalUtc(new Date());
  const dtstart = toICalUtc(startLocal);
  const dtend = toICalUtc(endLocal);
  const created = dtstamp;
  const modified = dtstamp;

  const uid = `${Date.now()}-${customerEmail.replace("@", "-at-")}@theprosperityfinancial.com`;
  const summary = `Strategy Session - ${customerName}`;
  const description = icalEscape(
    `Strategy Session with ${customerName}. Email: ${customerEmail}${
      notes ? `. Notes: ${notes}` : ""
    }`
  );

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Prosperity Financial//Appointment Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `CREATED:${created}`,
    `LAST-MODIFIED:${modified}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${icalEscape(summary)}`,
    `DESCRIPTION:${description}`,
    "LOCATION:Virtual Meeting",
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "TRANSP:OPAQUE",
    "X-MICROSOFT-CDO-BUSYSTATUS:BUSY",
    "ORGANIZER;CN=Davin Des:mailto:davindes@theprosperityfinancial.com",
    `ATTENDEE;CN=${icalEscape(
      customerName
    )};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${customerEmail}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: Strategy Session in 15 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n") + "\r\n"; // Final CRLF for Outlook
}

// Convert to Base64 UTF-8 safely
function toBase64Utf8(str: string) {
  return b64encode(new TextEncoder().encode(str));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { action, appointmentData, appointmentId } = await req.json();
    console.log("Appointment action:", action, appointmentData);

    switch (action) {
      case "create": {
        const { error } = await supabaseClient.from("appointments").insert({
          customer_name: appointmentData.customerName,
          customer_email: appointmentData.customerEmail,
          customer_phone: appointmentData.customerPhone,
          event_date: appointmentData.eventDate,
          event_time: appointmentData.eventTime,
          event_type: "consultation",
          special_requests: appointmentData.notes || null,
          status: "pending",
        });

        if (error) throw error;

        try {
          console.log("Attempting to send email notification...");

          const icsContent = generateICalendar(appointmentData);
          const icsBase64 = toBase64Utf8(icsContent);

          const emailResult = await resend.emails.send({
            from: "Appointments <appointments@theprosperityfinancial.com>",
            to: ["davindes@theprosperityfinancial.com"],
            subject: `New Strategy Session Booked - ${appointmentData.customerName}`,
            html: `
              <h2>New Appointment Booked</h2>
              <p><strong>Client:</strong> ${appointmentData.customerName}</p>
              <p><strong>Email:</strong> ${appointmentData.customerEmail}</p>
              <p><strong>Phone:</strong> ${appointmentData.customerPhone || "Not provided"}</p>
              <p><strong>Date:</strong> ${appointmentData.eventDate}</p>
              <p><strong>Time:</strong> ${appointmentData.eventTime}</p>
              ${
                appointmentData.notes
                  ? `<p><strong>Notes:</strong> ${appointmentData.notes}</p>`
                  : ""
              }
              <p><em>A calendar invitation is attached to this email.</em></p>
            `,
            attachments: [
              {
                filename: "appointment.ics",
                content: icsBase64,
                contentType: "text/calendar; method=REQUEST; charset=UTF-8",
              },
            ],
          });

          console.log("Email sent successfully:", emailResult);
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "reschedule": {
        const { data, error } = await supabaseClient
          .from("appointments")
          .update({
            event_date: appointmentData.eventDate,
            event_time: appointmentData.eventTime,
            updated_at: new Date().toISOString(),
          })
          .eq("id", appointmentId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, appointment: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "cancel": {
        const { data, error } = await supabaseClient
          .from("appointments")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", appointmentId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, appointment: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "get-availability": {
        const today = new Date().toISOString().split("T")[0];
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        const end = endDate.toISOString().split("T")[0];

        const { data, error } = await supabaseClient
          .from("appointments")
          .select("event_date, event_time")
          .gte("event_date", today)
          .lte("event_date", end)
          .neq("status", "cancelled");

        if (error) throw error;

        const availableSlots = [
          "09:00",
          "10:00",
          "11:00",
          "12:00",
          "13:00",
          "14:00",
          "15:00",
          "16:00",
          "17:00",
        ];

        const bookedSlots = new Set(data.map((apt) => `${apt.event_date}_${apt.event_time}`));

        return new Response(
          JSON.stringify({ success: true, bookedSlots: Array.from(bookedSlots), availableSlots }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "get-by-email": {
        const { data, error } = await supabaseClient
          .from("appointments")
          .select("*")
          .eq("customer_email", appointmentData.email)
          .neq("status", "cancelled")
          .order("event_date", { ascending: true });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, appointments: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid action" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
