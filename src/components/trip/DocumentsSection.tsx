import { useState } from "react";
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
import { Plus, FileText, Download, Trash2, Loader2, Upload } from "lucide-react";

interface TripDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  notes: string | null;
  uploaded_at: string | null;
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
  tripId: string;
  documents: TripDocument[];
  userId: string;
  onReload: () => void;
}

export function DocumentsSection({ tripId, documents, userId, onReload }: Props) {
  const { toast } = useToast();
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("other");
  const [docName, setDocName] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const filePath = `${tripId}/${Date.now()}_${file.name}`;
      const { data, error: uploadErr } = await supabase.storage
        .from("trip-documents")
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("trip-documents")
        .getPublicUrl(data.path);

      const { error: dbErr } = await supabase.from("trip_documents").insert({
        trip_id: tripId,
        user_id: userId,
        document_type: docType,
        file_name: docName || file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        notes: notes || null,
      } as any);

      if (dbErr) throw dbErr;

      toast({ title: "Document uploaded!" });
      setShowUpload(false);
      setFile(null);
      setNotes("");
      setDocName("");
      setDocType("other");
      onReload();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: TripDocument) => {
    // Extract storage path from URL
    const pathMatch = doc.file_url.match(/trip-documents\/(.+)/);
    if (pathMatch) {
      await supabase.storage.from("trip-documents").remove([pathMatch[1]]);
    }
    const { error } = await supabase.from("trip_documents").delete().eq("id", doc.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Document deleted" });
    onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documents</h3>
        <Button size="sm" onClick={() => setShowUpload(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Upload Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No documents yet. Upload passports, visas, insurance, and booking confirmations.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <Card key={doc.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs capitalize">{doc.document_type}</Badge>
                      {doc.file_size && <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>}
                      {doc.uploaded_at && <span className="text-xs text-muted-foreground">{new Date(doc.uploaded_at).toLocaleDateString()}</span>}
                    </div>
                    {doc.notes && <p className="text-xs text-muted-foreground mt-1 italic">{doc.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(doc)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload travel documents for this trip.</DialogDescription>
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
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g. Expires Dec 2028" />
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
  );
}
