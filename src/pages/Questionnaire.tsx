import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SoulPrintQuestionnaire from "@/components/SoulPrintQuestionnaire";
import { Loader2 } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";

const Questionnaire = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Questionnaire - Auth state:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Redirect to auth if not logged in
        if (!session?.user && event === 'SIGNED_OUT') {
          navigate('/auth');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Questionnaire - Session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // If not logged in, redirect to auth
      if (!session?.user) {
        navigate('/auth');
      } else {
        // Check if user has already completed questionnaire
        const { data: respondent } = await supabase
          .from('respondents')
          .select('id')
          .eq('user_id', session.user.id)
          .single();
        
        if (respondent) {
          navigate('/dashboard');
        } else {
          // Check if intake is completed
          const { data: intake } = await supabase
            .from('context_intake')
            .select('completed')
            .eq('user_id', session.user.id)
            .eq('completed', true)
            .limit(1)
            .maybeSingle();
          
          if (!intake) {
            navigate('/intake');
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <SoulPrintQuestionnaire user={user} />
    </div>
  );
};

export default Questionnaire;
