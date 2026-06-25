// Public iCal (.ics) feed of a user's upcoming classes / video rooms.
// Designed to be subscribed to from Google / Apple / Outlook Calendar.
// Auth model: a per-user opaque token is passed as ?uid=<user_id>&token=<token>.
// For MVP we accept just ?uid=<user_id> (the feed is read-only and only contains
// upcoming room titles + join URLs). RLS bypassed via service role for read.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function pad(n: number) { return String(n).padStart(2, "0"); }
function toICSDate(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}
function escapeICS(s: string) {
  return (s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const uid = url.searchParams.get("uid");
    if (!uid) {
      return new Response("Missing uid", { status: 400, headers: corsHeaders });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: rooms } = await sb
      .from("video_rooms")
      .select("id,title,scheduled_at,started_at,ended_at,room_code,provider,scope,description")
      .or(`scheduled_at.gte.${since},started_at.not.is.null`)
      .order("scheduled_at", { ascending: true })
      .limit(200);

    const now = new Date();
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Edu Zambia//Class Feed//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Edu Zambia Classes",
      "X-WR-TIMEZONE:Africa/Lusaka",
    ];

    for (const r of rooms || []) {
      const start = r.scheduled_at ? new Date(r.scheduled_at) : (r.started_at ? new Date(r.started_at) : null);
      if (!start) continue;
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const joinUrl = r.provider === "jitsi"
        ? `https://meet.jit.si/${r.room_code}`
        : `https://learn-smart-zambia-hub.lovable.app/video-rooms?room=${encodeURIComponent(r.room_code)}`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${r.id}@eduzambia`,
        `DTSTAMP:${toICSDate(now)}`,
        `DTSTART:${toICSDate(start)}`,
        `DTEND:${toICSDate(end)}`,
        `SUMMARY:${escapeICS(r.title || "Class")}`,
        `DESCRIPTION:${escapeICS((r.description || "Live class on Edu Zambia") + "\\nJoin: " + joinUrl)}`,
        `URL:${joinUrl}`,
        `LOCATION:${escapeICS(joinUrl)}`,
        "END:VEVENT",
      );
    }

    lines.push("END:VCALENDAR");

    return new Response(lines.join("\r\n"), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename=eduzambia-${uid}.ics`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    return new Response("Feed error: " + (e instanceof Error ? e.message : String(e)), {
      status: 500, headers: corsHeaders,
    });
  }
});
