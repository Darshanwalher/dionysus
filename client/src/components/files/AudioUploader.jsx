import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileAudio, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ACCEPTED_TYPES = {
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/ogg": [".ogg"],
  "application/ogg": [".ogg"],
  "audio/webm": [".webm"],
  "video/webm": [".webm"],
  "audio/mp4": [".m4a"],
  "audio/x-m4a": [".m4a"],
  "video/mp4": [".mp4"],
};

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

export default function AudioUploader({ onUpload, isLoading }) {
  const [file, setFile] = useState(null);
  const [meetingName, setMeetingName] = useState("");

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles && rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors?.[0];
      if (error?.code === "file-too-large") {
        toast.error("File is too large. Maximum size is 500 MB.");
      } else if (error?.code === "file-invalid-type") {
        toast.error("Unsupported file type. Please upload MP3, WAV, OGG, M4A, MP4, or WebM.");
      } else {
        toast.error(error?.message || "Invalid file");
      }
      return;
    }

    if (acceptedFiles && acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      setFile(selected);
      // Clean filename for default meeting title
      const cleanName = selected.name.replace(/\.[^/.]+$/, "");
      setMeetingName(cleanName);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: isLoading,
  });

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!file) {
      toast.error("Please select an audio file first");
      return;
    }
    onUpload(file, meetingName.trim());
  };

  const removeFile = (e) => {
    e?.stopPropagation();
    setFile(null);
    setMeetingName("");
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3.5">
      {!file ? (
        <div
          {...getRootProps()}
          className={`border border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-colors duration-150 ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-secondary/40 bg-card"
          }`}
        >
          <input {...getInputProps()} />
          <div className="mx-auto h-10 w-10 rounded-md bg-secondary border border-border flex items-center justify-center text-primary mb-2.5">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-foreground">
            {isDragActive ? "Drop the audio recording here…" : "Drag & drop engineering audio recording here"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or <span className="text-primary font-medium underline underline-offset-2">browse files from your system</span>
          </p>
          <p className="text-[11px] text-muted-foreground font-mono mt-2">
            MP3, WAV, OGG, M4A, MP4, WebM • Up to 500 MB
          </p>
        </div>
      ) : (
        <div className="space-y-3 p-3.5 rounded-lg border border-border bg-card">
          {/* Selected File Card */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <FileAudio className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate max-w-xs sm:max-w-md">
                  {file.name}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                  <span className="font-mono">{formatSize(file.size)}</span>
                  <span>•</span>
                  <span className="text-primary flex items-center gap-1 font-mono">
                    <CheckCircle2 className="h-3 w-3" /> Ready
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              disabled={isLoading}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
              title="Remove file"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Optional Title Customization */}
          <div className="space-y-1 pt-2 border-t border-border/50">
            <label className="text-[11px] font-medium text-muted-foreground">
              Meeting Title <span className="text-[10px] text-muted-foreground/70">(optional — defaults to filename)</span>
            </label>
            <Input
              type="text"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              placeholder="e.g. Sprint Architecture Sync, Backend Review…"
              className="text-xs h-8 bg-card"
              disabled={isLoading}
            />
          </div>

          {/* Upload Button */}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-8.5 text-xs font-semibold mt-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Uploading &amp; Transcribing Audio…
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload &amp; Process Meeting Audio
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

