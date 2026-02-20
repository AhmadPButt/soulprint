import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Download, Trash2, Loader2, Upload, Scan, CheckCircle2 } from "lucide-react";

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

const DOC_TYPE_ICONS: Record<string, string> = {
  passport: "🛂",
  visa: "📋",
  insurance: "🛡️",
  vaccination: "💉",
  booking: "🎫",
  other: "📄",
};

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [docType, setDocType] = useState("other");
  const [docName, setDocName] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [ocrDone, setOcrDone] = useState(false);

  const handleFileSelect = async (selected: File) => {
    setFile(selected);
    setOcrDone(false);
    // Auto-OCR for images and PDFs
    if (selected.type.startsWith("image/") || selected.type === "application/pdf") {
      await runOCR(selected);
    }
  };

  const runOCR = async (selectedFile: File) => {
    setScanning(true);
    try {
      // Convert to base64 for AI OCR
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // strip data URL prefix
        };
        reader.readAsDataURL(selectedFile);
      });

      const mimeType = selectedFile.type || "image/jpeg";

      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:${mimeType};base64,${base64}` },
                },
                {
                  type: "text",
                  text: `This is a travel document. Extract the following details in JSON:
                  {
                    "document_type": "passport|visa|insurance|vaccination|booking|other",
                    "document_name": "short descriptive name e.g. 'John Smith Passport'",
                    "notes": "key info: expiry date, reference numbers, valid for, etc."
                  }
                  Respond ONLY with valid JSON, nothing else.`,
                },
              ],
            },
          ],
          system_prompt: "You are a document scanner. Extract key travel document information and return only valid JSON.",
        },
      });

      if (!error && data?.message) {
        try {
          // Try to parse JSON from response
          const raw = data.message.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(raw);
          if (parsed.document_type && DOC_TYPES.find(d => d.value === parsed.document_type)) {
            setDocType(parsed.document_type);
          }
          if (parsed.document_name) setDocName(parsed.document_name);
          if (parsed.notes) setNotes(parsed.notes);
          setOcrDone(true);
        } catch {
          // JSON parse failed, skip auto-fill
        }
      }
    } catch (err) {
      console.warn("OCR failed:", err);
    } finally {
      setScanning(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      const filePath = `${tripId}/${Date.now()}_${file.name}`;

      // Simulate progress since Supabase storage doesn't expose native XHR progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 85) { clearInterval(progressInterval); return prev; }
          return prev + Math.random() * 15;
        });
      }, 200);

      const { data, error: uploadErr } = await supabase.storage
        .from("trip-documents")
        .upload(filePath, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

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
      setUploadProgress(0);
      setOcrDone(false);
      onReload();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setUploadProgress(0);
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
        <Card className="p-8 text-center border-dashed">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No documents yet.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Upload passports, visas, insurance, and booking confirmations.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <Card key={doc.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shrink-0 text-lg">
                    {DOC_TYPE_ICONS[doc.document_type] || "📄"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
      <Dialog open={showUpload} onOpenChange={(open) => { if (!uploading) { setShowUpload(open); if (!open) { setFile(null); setUploadProgress(0); setOcrDone(false); setDocName(""); setNotes(""); setDocType("other"); } } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload travel documents — we'll auto-scan and fill details for you.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">

            {/* File drop zone */}
            <div className="space-y-1">
              <Label>File</Label>
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${file ? "border-primary/40 bg-accent/30" : "border-border"}`}>
                {file ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">{DOC_TYPE_ICONS[docType] || "📄"}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    {scanning && (
                      <div className="flex items-center justify-center gap-2 text-xs text-primary animate-pulse">
                        <Scan className="h-3.5 w-3.5" /> Scanning document with AI...
                      </div>
                    )}
                    {ocrDone && !scanning && (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Details auto-filled from scan
                      </div>
                    )}
                    {!uploading && <Button variant="link" size="sm" className="text-xs" onClick={() => { setFile(null); setOcrDone(false); }}>Remove</Button>}
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">Click to select a file</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">PDF, PNG, JPG up to 20MB · AI auto-scan included</p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading…</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="space-y-1">
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {DOC_TYPE_ICONS[t.value]} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Document Name</Label>
              <Input value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. John's Passport" />
            </div>

            <div className="space-y-1">
              <Label>Notes <span className="text-muted-foreground/60 font-normal">(optional)</span></Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g. Expires Dec 2028, Ref #ABC123" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)} disabled={uploading}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading || !file || scanning}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
