import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Survey = {
  id: string;
  survey_type: string;
  question: string;
  customer_name: string | null;
  status: string;
  expires_at: string | null;
};

const FeedbackResponse = () => {
  const { token } = useParams<{ token: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data } = await supabase
        .from("crm_feedback_surveys")
        .select("id,survey_type,question,customer_name,status,expires_at")
        .eq("token", token)
        .maybeSingle();
      setSurvey(data as Survey | null);
      if (data?.status === "responded") setSubmitted(true);
      setLoading(false);
    })();
  }, [token]);

  const submit = async () => {
    if (score === null || !survey) {
      toast({ title: "Please pick a rating", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("crm_feedback_surveys")
      .update({ score, comment: comment || null })
      .eq("token", token!);
    setSubmitting(false);
    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
      return;
    }
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Survey not available</h1>
          <p className="text-muted-foreground">This feedback link is invalid or has expired.</p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md text-center">
          <CheckCircle2 className="h-14 w-14 mx-auto text-emerald-600 mb-3" />
          <h1 className="text-2xl font-serif mb-2">Thank you!</h1>
          <p className="text-muted-foreground">Your feedback helps us improve.</p>
        </Card>
      </div>
    );
  }

  const isNps = survey.survey_type === "nps";
  const max = isNps ? 10 : 5;
  const scale = Array.from({ length: max + (isNps ? 1 : 0) }, (_, i) => (isNps ? i : i + 1));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-6 md:p-8 max-w-xl w-full">
        <h1 className="text-2xl font-serif mb-1">We'd love your feedback</h1>
        {survey.customer_name && <p className="text-sm text-muted-foreground mb-4">Hi {survey.customer_name},</p>}
        <p className="text-base mb-6">{survey.question}</p>

        {isNps ? (
          <div>
            <div className="grid grid-cols-11 gap-1 mb-2">
              {scale.map((n) => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  className={`aspect-square rounded-md border text-sm font-semibold transition ${
                    score === n
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Not at all likely</span>
              <span>Extremely likely</span>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 justify-center">
            {scale.map((n) => (
              <button key={n} onClick={() => setScore(n)} className="p-1">
                <Star
                  className={`h-10 w-10 ${
                    score !== null && n <= score ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        <div className="mt-6">
          <label className="text-sm font-medium">Tell us more (optional)</label>
          <Textarea
            rows={4}
            placeholder="What did we do well? What could be better?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1"
          />
        </div>

        <Button className="w-full mt-6" size="lg" onClick={submit} disabled={submitting || score === null}>
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Submit feedback
        </Button>
      </Card>
    </div>
  );
};

export default FeedbackResponse;
