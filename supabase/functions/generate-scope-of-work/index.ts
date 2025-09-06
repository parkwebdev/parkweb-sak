import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateSOWRequest {
  submissionId?: string;
  clientData?: {
    client_name: string;
    client_email: string;
    project_type: string;
    description: string;
    timeline: string;
    budget_range: string;
    industry: string;
  };
  customPrompt?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { submissionId, clientData, customPrompt }: GenerateSOWRequest = await req.json();
    
    let projectData = clientData;
    
    // If submissionId is provided, fetch the submission data
    if (submissionId && !clientData) {
      const { data: submission, error } = await supabase
        .from('onboarding_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();
      
      if (error || !submission) {
        throw new Error('Submission not found');
      }
      
      projectData = submission;
    }
    
    if (!projectData) {
      throw new Error('No project data provided');
    }

    // Create a comprehensive prompt for scope of work generation
    const systemPrompt = `You are an expert business consultant and technical writer specializing in creating detailed, professional Statements of Work (SOWs). Create a comprehensive, well-structured SOW that includes:

1. **Executive Summary** - Brief project overview and objectives
2. **Project Scope** - Detailed breakdown of deliverables and services
3. **Timeline & Milestones** - Project phases with specific deadlines
4. **Budget & Payment Terms** - Cost breakdown and payment schedule
5. **Technical Requirements** - Specific technical specifications if applicable
6. **Assumptions & Dependencies** - Project assumptions and external dependencies
7. **Success Criteria** - How project success will be measured
8. **Terms & Conditions** - Legal and operational terms

Use professional business language, be specific about deliverables, and ensure the SOW is legally sound and comprehensive. Format the output in clean, readable sections with clear headings.`;

    const userPrompt = `Create a detailed Statement of Work based on the following client information:

**Client Details:**
- Name: ${projectData.client_name}
- Email: ${projectData.client_email}
- Industry: ${projectData.industry}

**Project Information:**
- Project Type: ${projectData.project_type}
- Description: ${projectData.description}
- Timeline: ${projectData.timeline}
- Budget Range: ${projectData.budget_range}

${customPrompt ? `**Additional Requirements:**\n${customPrompt}` : ''}

Please generate a comprehensive, professional Statement of Work that addresses all aspects of this project. Include specific deliverables, timelines, and terms that would be appropriate for this type of ${projectData.project_type} project in the ${projectData.industry} industry.`;

    console.log('Sending request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI Response received successfully');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI');
    }

    const generatedContent = data.choices[0].message.content;
    
    // Generate a professional title for the SOW
    const title = `Statement of Work - ${projectData.project_type} for ${projectData.client_name}`;

    const result = {
      title,
      content: generatedContent,
      client: projectData.client_name,
      client_contact: projectData.client_name,
      email: projectData.client_email,
      industry: projectData.industry,
      project_type: projectData.project_type,
      status: 'Draft',
      pages: Math.ceil(generatedContent.length / 3000), // Rough estimate of pages
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in generate-scope-of-work function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});