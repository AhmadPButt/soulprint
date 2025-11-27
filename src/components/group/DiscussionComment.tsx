import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface DiscussionCommentProps {
  comment: any;
}

export function DiscussionComment({ comment }: DiscussionCommentProps) {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setDeleting(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id !== comment.user_id) {
      toast({
        title: "Permission denied",
        description: "You can only delete your own comments",
        variant: "destructive",
      });
      setDeleting(false);
      return;
    }

    const { error } = await supabase
      .from('itinerary_discussions')
      .delete()
      .eq('id', comment.id);

    if (error) {
      toast({
        title: "Error deleting comment",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed",
      });
    }
    
    setDeleting(false);
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-2">
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </p>
          <p className="whitespace-pre-wrap">{comment.comment_text}</p>
          {comment.day_reference && (
            <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded">
              Day {comment.day_reference}
            </span>
          )}
          {comment.activity_reference && (
            <span className="inline-block px-2 py-1 text-xs bg-secondary/10 text-secondary-foreground rounded">
              {comment.activity_reference}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}