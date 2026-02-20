import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, RefreshCw, Brain, FileText } from "lucide-react";

interface SystemPrompt {
  id: string;
  prompt_key: string;
  prompt_name: string;
  prompt_content: string;
  description: string | null;
  updated_at: string;
}

export function SystemPromptsTab() {
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [regeneratingAll, setRegeneratingAll] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("system_prompts")
      .select("*")
      .order("prompt_key");
    if (error) {
      toast({ title: "Error", description: "Failed to load prompts", variant: "destructive" });
    } else {
      setPrompts(data || []);
      const initial: Record<string, string> = {};
      (data || []).forEach((p: SystemPrompt) => { initial[p.id] = p.prompt_content; });
      setEditedContent(initial);
    }
    setLoading(false);
  };

  const savePrompt = async (prompt: SystemPrompt) => {
    setSaving(prompt.id);
    const { error } = await (supabase as any)
      .from("system_prompts")
      .update({ prompt_content: editedContent[prompt.id], updated_at: new Date().toISOString() })
      .eq("id", prompt.id);
    if (error) {
      toast({ title: "Error", description: "Failed to save prompt", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `${prompt.prompt_name} prompt updated successfully` });
      await loadPrompts();
    }
    setSaving(null);
  };

  const regenerateAllNarratives = async () => {
    setRegeneratingAll(true);
    try {
      // Get all respondents with computed scores
      const { data: respondents } = await supabase
        .from("respondents")
        .select("id, user_id")
        .not("user_id", "is", null);

      const { data: computedList } = await supabase
        .from("computed_scores")
        .select("respondent_id");

      const respondentsWithScores = respondents?.filter(r =>
        computedList?.some(c => c.respondent_id === r.id)
      ) || [];

      let success = 0;
      for (const r of respondentsWithScores.slice(0, 20)) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) break;
          const res = await supabase.functions.invoke("compute-soulprint", {
            body: { respondent_id: r.id, regenerate: true }
          });
          if (!res.error) success++;
        } catch (_) {
          // continue
        }
      }
      toast({ title: "Done", description: `Regenerated narratives for ${success} travelers` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to regenerate narratives", variant: "destructive" });
    }
    setRegeneratingAll(false);
  };

  const hasChanges = (prompt: SystemPrompt) => editedContent[prompt.id] !== prompt.prompt_content;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">System Prompts</h3>
          <p className="text-sm text-muted-foreground">Manage AI prompts used for narrative and itinerary generation</p>
        </div>
        <Button
          variant="outline"
          onClick={regenerateAllNarratives}
          disabled={regeneratingAll}
          className="gap-2"
        >
          {regeneratingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Re-generate All Narratives
        </Button>
      </div>

      {prompts.map(prompt => (
        <Card key={prompt.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {prompt.prompt_key === "narrative_soulprint" ? (
                  <Brain className="h-5 w-5 text-primary" />
                ) : (
                  <FileText className="h-5 w-5 text-primary" />
                )}
                <div>
                  <CardTitle className="text-base">{prompt.prompt_name}</CardTitle>
                  {prompt.description && (
                    <CardDescription className="mt-0.5">{prompt.description}</CardDescription>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges(prompt) && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">Unsaved changes</Badge>
                )}
                <Badge variant="outline" className="text-xs font-mono">{prompt.prompt_key}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(prompt.updated_at).toLocaleString()}
            </div>
            <Textarea
              value={editedContent[prompt.id] || ""}
              onChange={e => setEditedContent(prev => ({ ...prev, [prompt.id]: e.target.value }))}
              className="font-mono text-xs min-h-[300px] resize-y"
              placeholder="Enter prompt content..."
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditedContent(prev => ({ ...prev, [prompt.id]: prompt.prompt_content }))}
                disabled={!hasChanges(prompt)}
              >
                Reset
              </Button>
              <Button
                size="sm"
                onClick={() => savePrompt(prompt)}
                disabled={saving === prompt.id || !hasChanges(prompt)}
                className="gap-2"
              >
                {saving === prompt.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
