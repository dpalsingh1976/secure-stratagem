import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------- iCalendar helpers ----------
function icalEscape(s = "") {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toICalUtc(d: Date) {
  // 20251010T150000Z
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

// Treat submitted local time as Eastern. For perfect DST, compute offset dynamically.
// Here, assume current EDT (-04:00); switch to -05:00 in winter or compute via a TZ lib.
function parseEastern(eventDate: string, eventTime: string) {
  return new Date(`${eventDate}T${eventTime}:00-04:00`);
}

// ---------- ICS for EMAILED INVITE (METHOD:REQUEST) ----------
function generateICalForEmailInvite(a: any, organizerEmail: string): string {
  const { customerName, customerEmail, eventDate, eventTime, notes } = a;

  const start = parseEastern(eventDate, eventTime);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const dtstamp = toICalUtc(new Date());
  const uid = `${Date.now()}-${(customerEmail || "guest").replace("@", "-at-")}@theprosperityfinancial.com`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Prosperity Financial//Appointment Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `CREATED:${dtstamp}`,
    `LAST-MODIFIED:${dtstamp}`,
    `DTSTART:${toICalUtc(start)}`,
    `DTEND:${toICalUtc(end)}`,
    `SUMMARY:${icalEscape(`Strategy Session - ${customerName}`)}`,
    `DESCRIPTION:${icalEscape(
      `Strategy Session with ${customerName}. Email: ${customerEmail || "N/A"}${
        a.notes ? `. Notes: ${a.notes}` : ""
      }`
    )}`,
    "LOCATION:Virtual Meeting",
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "TRANSP:OPAQUE",
    "X-MICROSOFT-CDO-BUSYSTATUS:BUSY",
    `ORGANIZER;CN=Prosperity Financial:mailto:${organizerEmail}`,
    customerEmail
      ? `ATTENDEE;CN=${icalEscape(customerName || "Guest")};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${customerEmail}`
      : null,
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: Strategy Session in 15 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean) as string[];

  return lines.join("\r\n") + "\r\n"; // trailing CRLF helps Outlook
}

// ---------- ICS for DOWNLOAD/IMPORT (METHOD:PUBLISH) ----------
function generateICalForDownload(a: any): string {
  const { customerName, eventDate, eventTime, notes } = a;

  const start = parseEastern(eventDate, eventTime);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const dtstamp = toICalUtc(new Date());
  const uid = `${Date.now()}@theprosperityfinancial.com`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Prosperity Financial//Appointment Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${toICalUtc(start)}`,
    `DTEND:${toICalUtc(end)}`,
    `SUMMARY:${icalEscape(`Strategy Session - ${customerName}`)}`,
    `DESCRIPTION:${icalEscape(
      `Strategy Session with ${customerName}${notes ? `. Notes: ${notes}` : ""}`
    )}`,
    "LOCATION:Virtual Meeting",
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "TRANSP:OPAQUE",
    "X-MICROSOFT-CDO-BUSYSTATUS:BUSY",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n") + "\r\n";
}

// ---------- Server ----------
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
      // Create appointment + send meeting request by email
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

        // --- Email a proper meeting request (METHOD:REQUEST) ---
        // Organizer MUST MATCH the "from" address for Outlook to treat it as a real invite.
        const organizerEmail = "appointments@theprosperityfinancial.com";

        try {
          const icsContent = generateICalForEmailInvite(appointmentData, organizerEmail);
          const icsBase64 = btoa(icsContent);

          const emailResult = await resend.emails.send({
            from: `Prosperity Financial <${organizerEmail}>`, // matches ORGANIZER
            to: ["davindes@theprosperityfinancial.com"],       // keep as in your original flow
            subject: `New Strategy Session Booked - ${appointmentData.customerName}`,
            html: `
              <h2>New Appointment Booked</h2>
              <p><strong>Client:</strong> ${appointmentData.customerName}</p>
              <p><strong>Email:</strong> ${appointmentData.customerEmail || "Not provided"}</p>
              <p><strong>Phone:</strong> ${appointmentData.customerPhone || "Not provided"}</p>
              <p><strong>Date:</strong> ${appointmentData.eventDate}</p>
              <p><strong>Time:</strong> ${appointmentData.eventTime}</p>
              ${
                appointmentData.notes
                  ? `<p><strong>Notes:</strong> ${appointmentData.notes}</p>`
                  : ""
              }
              <p><em>A calendar meeting request is attached.</em></p>
            `,
            attachments: [
              {
                filename: "invite.ics",
                content: icsBase64, // Base64
                contentType: "text/calendar; method=REQUEST; charset=UTF-8",
              },
            ],
          });

          console.log("Email sent successfully:", emailResult);
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
          // do not throw; booking should still succeed
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Reschedule
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

      // Cancel
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

      // Availability
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

      // Get all active by email
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

      // NEW: Return a downloadable/import-friendly ICS (METHOD:PUBLISH)
      case "get-ics": {
        const ics = generateICalForDownload(appointmentData);
        return new Response(ics, {
          status: 200,
          headers: {
            ...corsHeaders,
            // correct type for direct download or browser "open"
            "Content-Type": "text/calendar; charset=UTF-8",
            "Content-Disposition": 'attachment; filename="appointment.ics"',
          },
        });
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
