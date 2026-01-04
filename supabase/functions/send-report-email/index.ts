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
    // Coverage Analysis
    dimeNeed: number;
    currentCoverage: number;
    protectionGap: number;
    // Product Fit - IUL
    iulFit: string;
    iulScore: number;
    iulStrategy?: string;
    iulPositives: string[];
    // Product Fit - FIA
    fiaFit: string;
    fiaScore: number;
    fiaStrategy?: string;
    fiaPositives: string[];
    fiaReason?: string;
    // Tax Buckets
    taxNowPct: number;
    taxLaterPct: number;
    taxNeverPct: number;
  };
  pdfBase64: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-report-email function invoked");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientEmail, clientName, summary, pdfBase64 }: ReportEmailRequest = await req.json();

    console.log(`Sending report email to: ${clientEmail} for client: ${clientName}`);

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    };

    const getFitBadge = (fit: string) => {
      const styles: Record<string, { bg: string; text: string; label: string }> = {
        'strong': { bg: '#16a34a', text: '#ffffff', label: 'Strong Fit' },
        'moderate': { bg: '#2563eb', text: '#ffffff', label: 'Moderate Fit' },
        'explore': { bg: '#f59e0b', text: '#ffffff', label: 'Worth Exploring' },
        'not_fit_yet': { bg: '#6b7280', text: '#ffffff', label: 'Not Yet' },
        'not_recommended': { bg: '#6b7280', text: '#ffffff', label: 'Not Recommended' },
        'weak': { bg: '#f59e0b', text: '#ffffff', label: 'Limited Fit' }
      };
      const style = styles[fit] || styles['not_recommended'];
      return `<span style="display: inline-block; background: ${style.bg}; color: ${style.text}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${style.label}</span>`;
    };

    const formatStrategy = (strategy?: string) => {
      if (!strategy) return '';
      const strategies: Record<string, string> = {
        'FIA_BUFFER_REDZONE': 'Buffer Zone Strategy',
        'FIA_INCOME_FLOOR': 'Income Floor Strategy',
        'FIA_GROWTH_PROTECTION': 'Growth Protection Strategy',
        'FIA_OPTIONAL': 'Optional Enhancement',
        'FIA_NOT_FIT_YET': 'Build Foundation First'
      };
      return strategies[strategy] || strategy;
    };

    // Build IUL positives HTML
    const iulPositivesHtml = summary.iulPositives.length > 0
      ? summary.iulPositives.slice(0, 2).map(p => `<li style="margin-bottom: 4px; color: #374151;">${p}</li>`).join('')
      : '<li style="color: #6b7280;">Review required</li>';

    // Build FIA positives HTML
    const fiaPositivesHtml = summary.fiaPositives.length > 0
      ? summary.fiaPositives.slice(0, 2).map(p => `<li style="margin-bottom: 4px; color: #374151;">${p}</li>`).join('')
      : '<li style="color: #6b7280;">Review required</li>';

    // Tax bucket recommendation
    const taxRecommendation = summary.taxNeverPct < 20 
      ? 'Consider increasing tax-free allocation (Roth IRA, IUL, HSA) for better tax diversification.'
      : 'Your tax diversification is on track.';

    // Protection gap status
    const hasProtectionGap = summary.protectionGap > 0;
    const protectionStatus = hasProtectionGap 
      ? { color: '#dc2626', icon: '⚠️', label: 'Gap Identified' }
      : { color: '#16a34a', icon: '✓', label: 'Covered' };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Financial Needs Assessment</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f3f4f6;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">Financial Needs Assessment</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">The Prosperity Financial</p>
          </div>
          
          <!-- Main Content -->
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            
            <p style="font-size: 16px; margin-bottom: 20px; color: #1f2937;">Dear ${clientName},</p>
            
            <p style="margin-bottom: 25px; color: #4b5563;">Thank you for completing your financial assessment. Below is a summary of your key findings.</p>
            
            <!-- Section 1: Life Insurance Coverage -->
            <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #1e40af;">
              <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
                🛡️ Life Insurance Coverage Analysis
              </h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #4b5563;">Total Protection Need (DIME)</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1f2937;">${formatCurrency(summary.dimeNeed)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4b5563;">Current Coverage</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1f2937;">${formatCurrency(summary.currentCoverage)}</td>
                </tr>
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 12px 0 8px 0; color: #1f2937; font-weight: 600;">
                    ${protectionStatus.icon} Protection Gap
                  </td>
                  <td style="padding: 12px 0 8px 0; text-align: right; font-weight: 700; font-size: 18px; color: ${protectionStatus.color};">
                    ${formatCurrency(summary.protectionGap)}
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Section 2: Product Suitability -->
            <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #059669;">
              <h2 style="color: #059669; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
                📊 Product Fit Analysis
              </h2>
              
              <!-- IUL -->
              <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 12px; border: 1px solid #e5e7eb;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <strong style="color: #1f2937;">Indexed Universal Life (IUL)</strong>
                  ${getFitBadge(summary.iulFit)}
                </div>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px;">
                  ${iulPositivesHtml}
                </ul>
              </div>
              
              <!-- FIA -->
              <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #e5e7eb;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <strong style="color: #1f2937;">Fixed Indexed Annuity (FIA)</strong>
                  ${getFitBadge(summary.fiaFit)}
                </div>
                ${summary.fiaStrategy ? `<p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280;">Strategy: ${formatStrategy(summary.fiaStrategy)}</p>` : ''}
                <ul style="margin: 0; padding-left: 18px; font-size: 13px;">
                  ${fiaPositivesHtml}
                </ul>
              </div>
            </div>
            
            <!-- Section 3: Tax Buckets -->
            <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #7c3aed;">
              <h2 style="color: #7c3aed; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
                💰 Tax Diversification Snapshot
              </h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
                <tr>
                  <td style="padding: 6px 0; color: #4b5563;">Tax Now (Taxable)</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1f2937;">${summary.taxNowPct}%</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #4b5563;">Tax Later (Tax-Deferred)</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1f2937;">${summary.taxLaterPct}%</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #4b5563;">Tax Never (Tax-Free)</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: 600; color: ${summary.taxNeverPct >= 20 ? '#16a34a' : '#f59e0b'};">${summary.taxNeverPct}%</td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 13px; color: #6b7280; font-style: italic;">
                ${taxRecommendation}
              </p>
            </div>
            
            <!-- CTA -->
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 10px; padding: 25px; text-align: center; margin-bottom: 25px;">
              <h3 style="color: white; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">Ready to Discuss Your Strategy?</h3>
              <p style="color: rgba(255,255,255,0.9); margin: 0 0 18px 0; font-size: 14px;">Schedule a complimentary consultation to create your personalized plan.</p>
              <a href="https://theprosperityfinancial.com/contact" 
                 style="display: inline-block; background: white; color: #047857; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                Schedule Free Consultation
              </a>
            </div>
            
            <!-- Attachment Note -->
            <div style="background: #fef3c7; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid #fcd34d;">
              <p style="margin: 0; font-size: 13px; color: #92400e;">
                📎 Your complete Financial Needs Assessment is attached as a PDF for your records.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
              Best regards,<br>
              <strong style="color: #1f2937;">The Prosperity Financial Team</strong>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #1f2937; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: #9ca3af; font-size: 11px; margin: 0 0 8px 0;">
              This report is for educational purposes only and does not constitute financial, tax, or legal advice.
              Consult with qualified professionals before making financial decisions.
            </p>
            <p style="color: #6b7280; font-size: 11px; margin: 0;">
              © ${new Date().getFullYear()} The Prosperity Financial. All rights reserved.
            </p>
          </div>
          
        </body>
      </html>
    `;

    const attachments = pdfBase64 ? [{
      filename: `Financial-Assessment-${clientName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
      content: pdfBase64,
    }] : [];

    // Send email to client
    const clientEmailResponse = await resend.emails.send({
      from: "The Prosperity Financial <reports@theprosperityfinancial.com>",
      to: [clientEmail],
      subject: `Your Financial Needs Assessment - The Prosperity Financial`,
      html: emailHtml,
      attachments,
    });

    console.log("Client email sent successfully:", clientEmailResponse);

    // Send copy to advisor
    const advisorEmailResponse = await resend.emails.send({
      from: "The Prosperity Financial <reports@theprosperityfinancial.com>",
      to: ["davindes@theprosperityfinancial.com"],
      subject: `[New Assessment] ${clientName} - ${hasProtectionGap ? 'Protection Gap' : 'Coverage OK'}`,
      html: `
        <h2>New Financial Needs Assessment</h2>
        <p><strong>Client:</strong> ${clientName}</p>
        <p><strong>Email:</strong> ${clientEmail}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        
        <h3>Coverage Analysis</h3>
        <ul>
          <li><strong>DIME Need:</strong> ${formatCurrency(summary.dimeNeed)}</li>
          <li><strong>Current Coverage:</strong> ${formatCurrency(summary.currentCoverage)}</li>
          <li><strong>Protection Gap:</strong> <span style="color: ${hasProtectionGap ? '#dc2626' : '#16a34a'}; font-weight: bold;">${formatCurrency(summary.protectionGap)}</span></li>
        </ul>
        
        <h3>Product Fit</h3>
        <ul>
          <li><strong>IUL:</strong> ${summary.iulFit} (Score: ${summary.iulScore})</li>
          <li><strong>FIA:</strong> ${summary.fiaFit} (Score: ${summary.fiaScore})${summary.fiaStrategy ? ` - ${formatStrategy(summary.fiaStrategy)}` : ''}</li>
        </ul>
        
        <h3>Tax Buckets</h3>
        <ul>
          <li>Tax Now: ${summary.taxNowPct}%</li>
          <li>Tax Later: ${summary.taxLaterPct}%</li>
          <li>Tax Never: ${summary.taxNeverPct}%</li>
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
