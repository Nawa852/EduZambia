// Per-user iCal (.ics) feed of upcoming classes / video rooms.
// Subscribable from Google / Apple / Outlook Calendar.
//
// Auth model: calendar clients cannot send a JWT, so the feed URL carries an
// HMAC-SHA256 token bound to the user id and signed with CALENDAR_FEED_SECRET.
// The signed URL itself is minted only for the authenticated user (POST with a
// Bearer JWT). Rooms are always filtered to that user.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FEED_SECRET = Deno.env.get("CALENDAR_FEED_SECRET") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pad(n: number) { return String(n).padStart(2, "0"); }
function toICSDate(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}
function escapeICS(s: string) {
  return (s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

async function signUid(uid: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(FEED_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(uid));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-shape comparison of the supplied token against the expected one. */
function tokensMatch(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!FEED_SECRET) {
    return new Response("Calendar feed not configured", { status: 503, headers: corsHeaders });
  }

  try {
    // --- Mint a signed feed URL for the authenticated caller -----------------
    if (req.method === "POST") {
      const authHeader = req.headers.get("Authorization") ?? "";
      if (!authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const sbUser = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data, error } = await sbUser.auth.getClaims(authHeader.replace("Bearer ", ""));
      const sub = data?.claims?.sub as string | undefined;
      if (error || !sub) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const token = await signUid(sub);
      return new Response(
        JSON.stringify({ url: `${SUPABASE_URL}/functions/v1/calendar-feed?uid=${sub}&token=${token}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Serve the feed, only for a correctly signed uid ---------------------
    const url = new URL(req.url);
    const uid = url.searchParams.get("uid") ?? "";
    const token = url.searchParams.get("token") ?? "";
    if (!UUID_RE.test(uid) || !token) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }
    if (!tokensMatch(token, await signUid(uid))) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Rooms this user hosts, plus rooms they are a participant of.
    const { data: joined } = await sb
      .from("video_room_participants")
      .select("room_id")
      .eq("user_id", uid);
    const roomIds = (joined || []).map((r: { room_id: string }) => r.room_id);

    let query = sb
      .from("video_rooms")
      .select("id,title,scheduled_at,started_at,ended_at,room_code,provider,scope,host_id")
      .or(`scheduled_at.gte.${since},started_at.not.is.null`)
      .order("scheduled_at", { ascending: true })
      .limit(200);

    query = roomIds.length
      ? query.or(`host_id.eq.${uid},id.in.(${roomIds.join(",")})`)
      : query.eq("host_id", uid);

    const { data: rooms } = await query;

    const now = new Date();
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Synapse//Class Feed//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Synapse Classes",
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
        `UID:${r.id}@synapse`,
        `DTSTAMP:${toICSDate(now)}`,
        `DTSTART:${toICSDate(start)}`,
        `DTEND:${toICSDate(end)}`,
        `SUMMARY:${escapeICS(r.title || "Class")}`,
        `DESCRIPTION:${escapeICS("Live class on Synapse.\\nJoin: " + joinUrl)}`,
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
        "Content-Disposition": "inline; filename=synapse-classes.ics",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    return new Response("Feed error: " + (e instanceof Error ? e.message : String(e)), {
      status: 500, headers: corsHeaders,
    });
  }
});
