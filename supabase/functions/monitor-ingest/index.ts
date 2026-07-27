import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const ALERT_RULES: Record<string, { threshold: number; windowMinutes: number; title: string }> = {
  'auth.session_hang': { threshold: 3, windowMinutes: 10, title: 'Auth session hangs detected' },
  'auth.bootstrap_failsafe': { threshold: 5, windowMinutes: 15, title: 'Auth bootstrap failsafe firing' },
  'ui.loading_experience_stuck': { threshold: 3, windowMinutes: 10, title: '"Loading your experience…" stuck for users' },
  'artifact.generation_failed': { threshold: 3, windowMinutes: 30, title: 'Artifact generation failures' },
  'artifact.generation_slow': { threshold: 10, windowMinutes: 30, title: 'Artifact generation is slow' },
  'ui.route_error': { threshold: 10, windowMinutes: 15, title: 'Client-side route errors spiking' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const eventType = typeof body.event_type === 'string' ? body.event_type.slice(0, 120) : null;
    if (!eventType) {
      return new Response(JSON.stringify({ error: 'event_type is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    // Attribute the event to a user when a valid token is supplied (optional).
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const { data } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = data?.user?.id ?? null;
    }

    const severity = ['info', 'warning', 'error', 'critical'].includes(body.severity) ? body.severity : 'info';

    const { error: insertError } = await supabase.from('system_events').insert({
      user_id: userId,
      event_type: eventType,
      severity,
      message: typeof body.message === 'string' ? body.message.slice(0, 1000) : null,
      route: typeof body.route === 'string' ? body.route.slice(0, 300) : null,
      role: typeof body.role === 'string' ? body.role.slice(0, 60) : null,
      duration_ms: Number.isFinite(body.duration_ms) ? Math.round(body.duration_ms) : null,
      metadata: typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : {},
      user_agent: typeof body.user_agent === 'string' ? body.user_agent.slice(0, 400) : null,
    });

    if (insertError) {
      console.error('system_events insert failed:', insertError.message);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Alert escalation
    const rule = ALERT_RULES[eventType];
    let alerted = false;
    if (rule) {
      const since = new Date(Date.now() - rule.windowMinutes * 60_000).toISOString();
      const { count } = await supabase
        .from('system_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', eventType)
        .gte('created_at', since);

      if ((count ?? 0) >= rule.threshold) {
        const { data: existing } = await supabase
          .from('monitoring_alerts')
          .select('id, occurrences')
          .eq('event_type', eventType)
          .eq('status', 'open')
          .gte('window_start', since)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('monitoring_alerts')
            .update({ occurrences: count ?? existing.occurrences })
            .eq('id', existing.id);
        } else {
          await supabase.from('monitoring_alerts').insert({
            event_type: eventType,
            severity: severity === 'critical' ? 'critical' : 'warning',
            title: rule.title,
            details: `${count} events in the last ${rule.windowMinutes} minutes (threshold ${rule.threshold}).`,
            occurrences: count ?? rule.threshold,
            window_start: since,
          });
        }
        alerted = true;
      }
    }

    return new Response(JSON.stringify({ ok: true, alerted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('monitor-ingest error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
