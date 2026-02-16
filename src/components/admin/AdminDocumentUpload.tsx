import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Download, Trash2, Loader2, Upload, FolderOpen } from "lucide-react";

interface TripDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  notes: string | null;
  uploaded_at: string | null;
}

interface Trip {
  id: string;
  trip_name: string;
  status: string | null;
}

const DOC_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "visa", label: "Visa" },
  { value: "insurance", label: "Insurance" },
  { value: "vaccination", label: "Vaccination" },
  { value: "booking", label: "Booking" },
  { value: "other", label: "Other" },
];

function formatFileSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  respondentId: string;
  respondentName: string;
  userId: string | null;
}

export function AdminDocumentUpload({ respondentId, respondentName, userId }: Props) {
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState("other");
  const [docName, setDocName] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadTrips();
  }, [respondentId]);

  useEffect(() => {
    if (selectedTripId) {
      loadDocuments(selectedTripId);
    }
  }, [selectedTripId]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trips")
        .select("id, trip_name, status")
        .eq("respondent_id", respondentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTrips(data || []);
      if (data && data.length > 0) {
        setSelectedTripId(data[0].id);
      }
    } catch (err) {
      console.error("Error loading trips:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (tripId: string) => {
    const { data, error } = await supabase
      .from("trip_documents")
      .select("*")
      .eq("trip_id", tripId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error loading documents:", error);
      return;
    }
    setDocuments(data || []);
  };

  const handleUpload = async () => {
    if (!file || !selectedTripId) return;
    setUploading(true);
    try {
      const filePath = `${selectedTripId}/${Date.now()}_${file.name}`;
      const { data, error: uploadErr } = await supabase.storage
        .from("trip-documents")
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("trip-documents")
        .getPublicUrl(data.path);

      // Use admin user_id or the respondent's user_id
      const uploadUserId = userId || "00000000-0000-0000-0000-000000000000";

      const { error: dbErr } = await supabase.from("trip_documents").insert({
        trip_id: selectedTripId,
        user_id: uploadUserId,
        document_type: docType,
        file_name: docName || file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        notes: notes || null,
      } as any);

      if (dbErr) throw dbErr;

      toast({ title: "Document uploaded for " + respondentName });
      setShowUpload(false);
      setFile(null);
      setNotes("");
      setDocName("");
      setDocType("other");
      loadDocuments(selectedTripId);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: TripDocument) => {
    const pathMatch = doc.file_url.match(/trip-documents\/(.+)/);
    if (pathMatch) {
      await supabase.storage.from("trip-documents").remove([pathMatch[1]]);
    }
    const { error } = await supabase.from("trip_documents").delete().eq("id", doc.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Document deleted" });
    if (selectedTripId) loadDocuments(selectedTripId);
  };

  if (loading) return null;
  if (trips.length === 0) return null;

  return (
    <div className="border border-border rounded-lg p-3 bg-background/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <FolderOpen className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium">
          Documents ({documents.length})
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {expanded ? "▾" : "▸"}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Trip selector if multiple trips */}
          {trips.length > 1 && (
            <Select value={selectedTripId || ""} onValueChange={setSelectedTripId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select trip" />
              </SelectTrigger>
              <SelectContent>
                {trips.map(t => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.trip_name} ({t.status || "draft"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Document list */}
          {documents.length > 0 ? (
            <div className="space-y-1.5">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{doc.file_name}</p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] capitalize">{doc.document_type}</Badge>
                        {doc.file_size && <span className="text-muted-foreground">{formatFileSize(doc.file_size)}</span>}
                      </div>
                      {doc.notes && <p className="text-muted-foreground italic mt-0.5">{doc.notes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-3 w-3" /></a>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(doc)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">No documents uploaded yet</p>
          )}

          <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => setShowUpload(true)}>
            <Plus className="h-3 w-3 mr-1" /> Upload Document for {respondentName}
          </Button>

          {/* Upload Dialog */}
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document for {respondentName}</DialogTitle>
                <DialogDescription>Upload travel documents on behalf of this traveler.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Document Type</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Document Name (optional)</Label>
                  <Input value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. John's Passport" />
                </div>
                <div className="space-y-1">
                  <Label>File</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    {file ? (
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        <Button variant="link" size="sm" onClick={() => setFile(null)}>Remove</Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">Click to select a file</p>
                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG up to 20MB</p>
                        <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0] || null)} />
                      </label>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Purpose / Notes (optional)</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g. Travel insurance policy, expires Dec 2028" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={uploading || !file}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
