import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReportEmailRequest {
  clientEmail: string;
  clientName: string;
  summary: {
    overallRiskScore: number;
    riskLevel: string;
    retirementScore?: number;
    retirementGrade?: string;
    protectionGap: number;
    netWorth: number;
    liquidityMonths: number;
    keyRecommendations: string[];
  };
  pdfBase64: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-report-email function invoked");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientEmail, clientName, summary, pdfBase64 }: ReportEmailRequest = await req.json();

    console.log(`Sending report email to: ${clientEmail} for client: ${clientName}`);

    // Format currency helper
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    };

    // Build recommendations list HTML
    const recommendationsHtml = summary.keyRecommendations.length > 0
      ? summary.keyRecommendations.map((rec, i) => `<li>${rec}</li>`).join('')
      : '<li>No critical recommendations at this time.</li>';

    // Build retirement section if available
    const retirementSection = summary.retirementScore !== undefined
      ? `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
            <strong>Retirement Readiness</strong>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${summary.retirementScore}/100 (${summary.retirementGrade || 'N/A'})
          </td>
        </tr>
      `
      : '';

    // Email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Financial Risk Assessment Report</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Financial Risk Assessment Report</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">The Prosperity Financial</p>
          </div>
          
          <!-- Main Content -->
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${clientName},</p>
            
            <p style="margin-bottom: 25px;">Thank you for completing your Financial Risk Assessment. Please find attached your comprehensive report.</p>
            
            <!-- Summary Box -->
            <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">Summary Highlights</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                    <strong>Overall Risk Score</strong>
                  </td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: ${summary.overallRiskScore >= 60 ? '#dc2626' : summary.overallRiskScore >= 40 ? '#f59e0b' : '#16a34a'};">
                    ${summary.overallRiskScore}/100 (${summary.riskLevel})
                  </td>
                </tr>
                ${retirementSection}
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                    <strong>Protection Gap</strong>
                  </td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    ${formatCurrency(summary.protectionGap)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                    <strong>Net Worth</strong>
                  </td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    ${formatCurrency(summary.netWorth)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px;">
                    <strong>Liquidity Runway</strong>
                  </td>
                  <td style="padding: 10px; text-align: right;">
                    ${summary.liquidityMonths.toFixed(1)} months
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Key Recommendations -->
            <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">Key Recommendations</h2>
              <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
                ${recommendationsHtml}
              </ol>
            </div>
            
            <!-- CTA -->
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 8px; padding: 25px; text-align: center; margin-bottom: 25px;">
              <h3 style="color: white; margin: 0 0 10px 0; font-size: 18px;">Ready to Take the Next Step?</h3>
              <p style="color: rgba(255,255,255,0.9); margin: 0 0 15px 0;">Schedule a complimentary consultation to discuss your personalized strategy.</p>
              <a href="https://theprosperityfinancial.com/contact" 
                 style="display: inline-block; background: white; color: #047857; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                Schedule Consultation
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
              Best regards,<br>
              <strong>The Prosperity Financial Team</strong>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #1f2937; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This report is for educational purposes only and does not constitute financial, tax, or legal advice.
            </p>
            <p style="color: #6b7280; font-size: 11px; margin: 10px 0 0 0;">
              © ${new Date().getFullYear()} The Prosperity Financial. All rights reserved.
            </p>
          </div>
          
        </body>
      </html>
    `;

    // Prepare attachments array
    const attachments = pdfBase64 ? [{
      filename: `Financial-Assessment-${clientName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
      content: pdfBase64,
    }] : [];

    // Send email to client
    const clientEmailResponse = await resend.emails.send({
      from: "The Prosperity Financial <reports@theprosperityfinancial.com>",
      to: [clientEmail],
      subject: `Your Financial Risk Assessment Report - The Prosperity Financial`,
      html: emailHtml,
      attachments,
    });

    console.log("Client email sent successfully:", clientEmailResponse);

    // Send copy to advisor
    const advisorEmailResponse = await resend.emails.send({
      from: "The Prosperity Financial <reports@theprosperityfinancial.com>",
      to: ["davindes@theprosperityfinancial.com"],
      subject: `[New Report] Financial Assessment for ${clientName}`,
      html: `
        <h2>New Financial Risk Assessment Report Generated</h2>
        <p><strong>Client:</strong> ${clientName}</p>
        <p><strong>Email:</strong> ${clientEmail}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <h3>Summary</h3>
        <ul>
          <li><strong>Overall Risk Score:</strong> ${summary.overallRiskScore}/100 (${summary.riskLevel})</li>
          ${summary.retirementScore !== undefined ? `<li><strong>Retirement Readiness:</strong> ${summary.retirementScore}/100 (${summary.retirementGrade})</li>` : ''}
          <li><strong>Protection Gap:</strong> ${formatCurrency(summary.protectionGap)}</li>
          <li><strong>Net Worth:</strong> ${formatCurrency(summary.netWorth)}</li>
          <li><strong>Liquidity:</strong> ${summary.liquidityMonths.toFixed(1)} months</li>
        </ul>
        <p>Full report attached.</p>
      `,
      attachments,
    });

    console.log("Advisor email sent successfully:", advisorEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        clientEmailId: clientEmailResponse.data?.id,
        advisorEmailId: advisorEmailResponse.data?.id
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-report-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
