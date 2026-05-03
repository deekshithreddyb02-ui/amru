import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const TOKEN_RE = /^[a-f0-9]{32}$/i;
const MAX_COMMENT_LENGTH = 2000;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const sanitizeToken = (value: unknown) => {
  const token = typeof value === "string" ? value.trim() : "";
  return TOKEN_RE.test(token) ? token : null;
};

const normalizeComment = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Comment must be ${MAX_COMMENT_LENGTH} characters or fewer`);
  }
  return trimmed;
};

const normalizeScore = (surveyType: string, value: unknown) => {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error("Please choose a valid rating");
  }

  const [min, max] = surveyType === "nps" ? [0, 10] : [1, 5];
  if (value < min || value > max) {
    throw new Error("Rating is outside the allowed range");
  }

  return value;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (req.method === "GET") {
      const url = new URL(req.url);
      const token = sanitizeToken(url.searchParams.get("token"));
      if (!token) return json(400, { error: "Invalid survey link" });

      const { data, error } = await supabase
        .from("crm_feedback_surveys")
        .select("id,survey_type,question,customer_name,status,expires_at")
        .eq("token", token)
        .maybeSingle();

      if (error) return json(500, { error: "Failed to load survey" });
      if (!data) return json(404, { error: "Survey not available" });

      const isExpired = data.expires_at && new Date(data.expires_at).getTime() <= Date.now();
      if (data.status === "expired" || isExpired) {
        return json(404, { error: "Survey not available" });
      }

      return json(200, {
        survey: {
          id: data.id,
          survey_type: data.survey_type,
          question: data.question,
          customer_name: data.customer_name,
          status: data.status,
          expires_at: data.expires_at,
        },
      });
    }

    if (req.method !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const body = await req.json().catch(() => null);
    const action = typeof body?.action === "string" ? body.action : "submit";
    const token = sanitizeToken(body?.token);
    if (!token) return json(400, { error: "Invalid survey link" });

    if (action === "load") {
      const { data, error } = await supabase
        .from("crm_feedback_surveys")
        .select("id,survey_type,question,customer_name,status,expires_at")
        .eq("token", token)
        .maybeSingle();

      if (error) return json(500, { error: "Failed to load survey" });
      if (!data) return json(404, { error: "Survey not available" });

      const isExpired = data.expires_at && new Date(data.expires_at).getTime() <= Date.now();
      if (data.status === "expired" || isExpired) {
        return json(404, { error: "Survey not available" });
      }

      return json(200, {
        survey: {
          id: data.id,
          survey_type: data.survey_type,
          question: data.question,
          customer_name: data.customer_name,
          status: data.status,
          expires_at: data.expires_at,
        },
      });
    }

    const { data: survey, error: surveyError } = await supabase
      .from("crm_feedback_surveys")
      .select("id,survey_type,status,expires_at")
      .eq("token", token)
      .maybeSingle();

    if (surveyError) return json(500, { error: "Failed to load survey" });
    if (!survey) return json(404, { error: "Survey not available" });

    const isExpired = survey.expires_at && new Date(survey.expires_at).getTime() <= Date.now();
    if (survey.status === "expired" || isExpired) {
      return json(410, { error: "This feedback link has expired" });
    }

    if (survey.status === "responded") {
      return json(409, { error: "Feedback has already been submitted" });
    }

    const score = normalizeScore(survey.survey_type, body?.score);
    const comment = normalizeComment(body?.comment);

    const { data: updatedRow, error: updateError } = await supabase
      .from("crm_feedback_surveys")
      .update({ score, comment })
      .select("id")
      .eq("id", survey.id)
      .eq("token", token)
      .eq("status", "sent")
      .maybeSingle();

    if (updateError) {
      return json(500, { error: "Failed to submit feedback" });
    }

    if (!updatedRow) {
      return json(409, { error: "Feedback has already been submitted" });
    }

    return json(200, { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = /rating|comment/i.test(message) ? 400 : 500;
    return json(status, { error: message });
  }
});