// Loits AI Worker
// Deploy this to Cloudflare Workers (free tier — 100k requests/day)
//
// Setup:
// 1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
// 2. Replace default code with this file's contents
// 3. Add environment variable: ANTHROPIC_API_KEY = sk-ant-...
//    (Settings → Variables → Add variable → Encrypt)
// 4. Deploy. Copy the worker URL (https://loits-ai.YOUR_SUBDOMAIN.workers.dev)
// 5. Paste that URL into index.html, replace AI_WORKER_URL constant
//
// Model: claude-sonnet-4-6 (May 2026 latest)
// Cost per analysis: ~€0.01-0.02 — roughly 800 input + 400 output tokens
// To reduce cost: switch to claude-haiku-4-5-20251001 (~10x cheaper, slightly less nuanced)

export default {
  async fetch(request, env) {
    // CORS — allow loits.app
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://loits.app',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const { optionA, optionB, verdict } = body;

      if (!optionA || !optionB || !verdict) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Build context for Claude
      const dataDescription = buildDataDescription(verdict);
      const prompt = buildPrompt(optionA, optionB, verdict, dataDescription);

      // Call Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Claude API error:', response.status, errText);
        return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const data = await response.json();
      const analysisText = data.content?.[0]?.text || '';

      return new Response(JSON.stringify({
        analysis: analysisText
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (err) {
      console.error('Worker error:', err);
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

function buildDataDescription(v) {
  if (v.status === 'failed') {
    return `Status: FAILED. Insufficient signal. The body did not produce measurable responses.`;
  }

  const lines = [];
  lines.push(`Status: ${v.status}`);
  if (v.confidence) lines.push(`Confidence: ${v.confidence}`);
  if (v.differential !== undefined) lines.push(`Differential between A and B response scores: ${v.differential}%`);
  if (v.aScore !== undefined) lines.push(`A response score: ${v.aScore}, B response score: ${v.bScore}`);

  // Metric details
  if (v.aBlinkAvg !== null && v.aBlinkAvg !== undefined) {
    lines.push(`A blink latency: ${Math.round(v.aBlinkAvg)} ms`);
  } else {
    lines.push(`A blink latency: not detected within 800ms window`);
  }
  if (v.bBlinkAvg !== null && v.bBlinkAvg !== undefined) {
    lines.push(`B blink latency: ${Math.round(v.bBlinkAvg)} ms`);
  } else {
    lines.push(`B blink latency: not detected within 800ms window`);
  }
  if (v.aAsymAvg !== null && v.aAsymAvg !== undefined) {
    lines.push(`A facial asymmetry delta: ${v.aAsymAvg.toFixed(2)}`);
  }
  if (v.bAsymAvg !== null && v.bAsymAvg !== undefined) {
    lines.push(`B facial asymmetry delta: ${v.bAsymAvg.toFixed(2)}`);
  }
  if (v.aBpmAvg !== null && v.aBpmAvg !== undefined) {
    lines.push(`A BPM change: ${v.aBpmAvg.toFixed(1)} bpm`);
  }
  if (v.bBpmAvg !== null && v.bBpmAvg !== undefined) {
    lines.push(`B BPM change: ${v.bBpmAvg.toFixed(1)} bpm`);
  }

  lines.push(`Valid trials: A=${v.aTrialCount}/2, B=${v.bTrialCount}/2, Neutral=${v.neutralTrialCount}/1`);

  if (v.metricAgreement) {
    lines.push(`Metric agreement: A=${v.metricAgreement.votesA}, B=${v.metricAgreement.votesB}, unanimous=${v.metricAgreement.unanimous}, majority=${v.metricAgreement.majority}`);
  }

  if (v.wantsOption) lines.push(`Body's apparent preference: option ${v.wantsOption} (rejected option ${v.rejectedOption})`);

  return lines.join('\n');
}

function buildPrompt(optionA, optionB, v, dataDescription) {
  return `You are an analyst for Loits, an instrument that measures the body's autonomic response to a binary choice. The user has just completed a reading.

OPTION A: "${optionA}"
OPTION B: "${optionB}"

MEASUREMENT DATA:
${dataDescription}

WHAT THE MEASUREMENTS MEAN:
- Blink latency under 300ms after stimulus = orienting reflex; the body marks something as salient or aversive
- Facial asymmetry delta > 1.0 = micro-expression leakage; the body's hemispheres processed the option differently before conscious masking
- BPM change > 3 = sympathetic nervous system activation; either approach or avoidance motivation
- "Body reacted more strongly to X" usually means X triggered more autonomic activation, often (but not always) avoidance

YOUR TASK:
Write a personal, psychologically perceptive analysis of this reading. The user came to Loits with a real dilemma. Speak to them as a thoughtful, perceptive interpreter — not as a doctor, not as a mystic, not as a coach.

Constraints:
- 150-280 words
- Use the specific options the user typed (paraphrase them if needed for flow, but reference them)
- Acknowledge ambiguity where ambiguity exists (the autonomic system signals "this matters" but does not always distinguish desire from fear)
- Do NOT prescribe. Do NOT make decisions for them.
- Do NOT pretend to know more than the measurements say
- Use **bold** sparingly for emphasis on key insights (markdown style)
- End with a question or framing that helps them think — not an answer
- Write in second person ("you")
- Tone: serious, intimate, calm. Like a perceptive friend who studies neuroscience.

Do not include any preamble. Begin directly with the analysis.`;
}
