import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function POST(request, context) {
  try {
    // In Next.js 15+, params must be awaited
    const { connectorId } = await context.params;
    const formData = await request.json();

    console.log('📥 Received submission for connector:', connectorId);
    console.log('📋 Form data:', formData);

    // 1. Look up the connector
    const { data: connector, error: connectorError } = await supabase
      .from('connectors')
      .select('*')
      .eq('id', connectorId)
      .single();

    if (connectorError || !connector) {
      console.error('❌ Connector not found:', connectorError);
      return NextResponse.json(
        { error: 'Connector not found', details: connectorError?.message },
        { status: 404 }
      );
    }

    console.log('✅ Connector found:', connector.name);

    // 3. Store submission in database
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        connector_id: connectorId,
        form_data: formData,
        destinations_sent: {},
        errors: null
      })
      .select()
      .single();

    if (submissionError) {
      console.error('❌ Error storing submission:', submissionError);
      return NextResponse.json(
        { error: 'Failed to store submission', details: submissionError.message },
        { status: 500 }
      );
    }

    console.log('✅ Submission stored with ID:', submission.id);

    // 4. Process destinations
    const destinations = connector.destinations || [];
    console.log('🔍 Raw destinations from database:', JSON.stringify(destinations, null, 2));
    console.log('🔍 Destinations type:', typeof destinations);
    console.log('🔍 Is array?:', Array.isArray(destinations));
    console.log('🔍 Length:', destinations.length);
    
    const results = {};

    // Flatten if double nested (fix for [[...]] format)
    let flatDestinations = destinations;
    if (destinations.length > 0 && Array.isArray(destinations[0])) {
      console.log('⚠️  Detected double-nested array, flattening...');
      flatDestinations = destinations[0];
    }

    console.log('🔍 Processing destinations:', JSON.stringify(flatDestinations, null, 2));

    for (const destination of flatDestinations) {
      console.log('🔍 Processing destination:', JSON.stringify(destination, null, 2));
      console.log('🔍 Type:', destination.type, 'Enabled:', destination.enabled);
      
      if (destination.type === 'email' && destination.enabled) {
        console.log('📧 Attempting to send email...');
        try {
          await sendEmail(destination, formData, connector);
          results.email = { success: true };
          console.log('✅ Email sent successfully');
        } catch (error) {
          results.email = { success: false, error: error.message };
          console.error('❌ Email error:', error.message);
          console.error('❌ Full error:', error);
        }
      } else {
        console.log('⏭️  Skipping destination (not email or not enabled)');
      }

      // TODO: Add other destination types (Sheets, Slack, SMS, Webhook)
    }

    // 5. Update submission with results
    console.log('💾 Updating submission with results:', results);
    await supabase
      .from('submissions')
      .update({
        destinations_sent: results
      })
      .eq('id', submission.id);

    console.log('✅ Submission processed successfully');

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      results
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
  if (text == null) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Helper function to send email via SendGrid
async function sendEmail(destination, formData, connector) {
  console.log('📧 sendEmail called with destination:', JSON.stringify(destination, null, 2));
  
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured');
  }

  const config = destination.config || {};
  console.log('📧 Email config:', JSON.stringify(config, null, 2));
  
  // Escape connector name to prevent HTML injection
  const safeConnectorName = escapeHtml(connector.name);
  
  // Build email content
  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">📋 New Form Submission</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px;">
        <p style="color: #666; margin-bottom: 20px;">
          You received a new submission from: <strong>${safeConnectorName}</strong>
        </p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
  `;

  // Add form fields with HTML escaping
  Object.entries(formData).forEach(([key, value]) => {
    const label = escapeHtml(key.charAt(0).toUpperCase() + key.slice(1));
    const safeValue = escapeHtml(value);
    htmlContent += `
      <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <strong style="color: #667eea; display: block; margin-bottom: 5px;">
          ${label}:
        </strong>
        <span style="color: #333;">
          ${safeValue || '(empty)'}
        </span>
      </div>
    `;
  });

  htmlContent += `
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            📊 This submission was logged in your Form Connector dashboard.
          </p>
        </div>
      </div>
      
      <div style="background: #333; padding: 20px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">
          Powered by Form-to-Everything Connector
        </p>
      </div>
    </div>
  `;

  // Plain text version (no escaping needed for plain text)
  let textContent = `New Form Submission from ${connector.name}\n\n`;
  Object.entries(formData).forEach(([key, value]) => {
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    textContent += `${label}: ${value || '(empty)'}\n`;
  });

  // Send email
  const msg = {
    to: config.to_email || config.toEmail,
    from: {
      email: config.from_email || config.fromEmail,
      name: config.from_name || config.fromName || 'Form Connector'
    },
    subject: config.subject || `New Form Submission - ${safeConnectorName}`,
    text: textContent,
    html: htmlContent
  };

  console.log('📧 Sending email with config:', JSON.stringify({
    to: msg.to,
    from: msg.from,
    subject: msg.subject
  }, null, 2));
  
  await sgMail.send(msg);
  console.log('📧 SendGrid send() completed');
}

// Handle OPTIONS for CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
