import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMeetings, processMeeting, uploadMeeting, deleteMeeting } from "@/store/slices/projectSlice";
import AudioUploader from "@/components/files/AudioUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import {
  Presentation,
  Upload,
  Link2,
  Trash2,
  Clock,
  Mic,
  Search,
  Sparkles,
  Headphones,
  FileAudio,
  ArrowRight,
} from "lucide-react";

const SAMPLE_AUDIO_URL = "https://actions.google.com/sounds/v1/speech/announcer_voice_sample.ogg";

export default function Meetings() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { meetings, isActionLoading } = useSelector((state) => state.project);
  const [inputMode, setInputMode] = useState("upload"); // "upload" | "url"
  const [audioUrl, setAudioUrl] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    dispatch(fetchMeetings(id));
  }, [dispatch, id]);

  const handleProcess = async (e) => {
    e.preventDefault();
    if (!audioUrl.trim()) {
      toast.error("Please enter a valid audio file URL");
      return;
    }
    const res = await dispatch(processMeeting({ projectId: id, audio_url: audioUrl.trim() }));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Meeting transcribed & topics extracted successfully!");
      setAudioUrl("");
    } else {
      toast.error(res.payload || "Failed to process meeting audio");
    }
  };

  const handleUpload = async (file, name) => {
    const res = await dispatch(uploadMeeting({ projectId: id, file, name }));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Meeting uploaded, transcribed & topics extracted successfully!");
    } else {
      toast.error(res.payload || "Failed to upload and process meeting");
    }
  };

  const handleDelete = async (meetingId, e) => {
    e.stopPropagation();
    const res = await dispatch(deleteMeeting(meetingId));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Meeting deleted");
    } else {
      toast.error("Failed to delete meeting");
    }
  };

  const totalTopics = useMemo(() => {
    return meetings.reduce((acc, m) => acc + (m.issues?.length || 0), 0);
  }, [meetings]);

  const filteredMeetings = useMemo(() => {
    if (!searchFilter.trim()) return meetings;
    const term = searchFilter.toLowerCase();
    return meetings.filter(
      (m) =>
        m.name?.toLowerCase().includes(term) ||
        m.issues?.some(
          (issue) =>
            issue.headline?.toLowerCase().includes(term) ||
            issue.gist?.toLowerCase().includes(term) ||
            issue.summary?.toLowerCase().includes(term)
        )
    );
  }, [meetings, searchFilter]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={Headphones}
        title="Meeting Audio Intelligence"
        description="Transcribe technical discussions, extract architecture decisions, and query meeting summaries"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {meetings.length} Session{meetings.length === 1 ? "" : "s"}
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              {totalTopics} Topic{totalTopics === 1 ? "" : "s"}
            </Badge>
          </div>
        }
      />

      {/* ─── Audio Ingestion & Processing Card ───────────────────────── */}
      <Card className="overflow-hidden animate-fade-up">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="icon-tile h-7 w-7 rounded">
                <Mic className="h-3.5 w-3.5" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Process Engineering Audio</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Upload an audio/video recording (up to 500 MB) or paste a hosted URL to generate timestamped chapters.
                </CardDescription>
              </div>
            </div>

            {/* Input Mode Selector */}
            <div className="flex items-center gap-1 p-0.5 bg-secondary/80 rounded-md border border-border self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setInputMode("upload")}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  inputMode === "upload"
                    ? "bg-card text-foreground font-medium shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="h-3 w-3 text-primary" />
                Upload File (500 MB)
              </button>
              <button
                type="button"
                onClick={() => setInputMode("url")}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  inputMode === "url"
                    ? "bg-card text-foreground font-medium shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Link2 className="h-3 w-3 text-primary" />
                Paste URL
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {inputMode === "upload" ? (
            <AudioUploader onUpload={handleUpload} isLoading={isActionLoading} />
          ) : (
            <div className="space-y-3.5">
              <form onSubmit={handleProcess} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="https://example.com/audio/engineering-sync.mp3"
                    className="pl-9 text-xs h-9 bg-card"
                    disabled={isActionLoading}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isActionLoading || !audioUrl.trim()}
                  className="h-9 text-xs px-4 font-semibold shrink-0"
                >
                  {isActionLoading ? "Transcribing Audio…" : "Transcribe & Analyze"}
                </Button>
              </form>

              {/* Formats and Demo helper */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground font-mono">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-sans font-medium text-foreground">Formats:</span>
                  <span className="px-1 py-0.2 rounded bg-secondary border border-border">MP3</span>
                  <span className="px-1 py-0.2 rounded bg-secondary border border-border">WAV</span>
                  <span className="px-1 py-0.2 rounded bg-secondary border border-border">M4A</span>
                  <span className="px-1 py-0.2 rounded bg-secondary border border-border">OGG</span>
                  <span className="px-1 py-0.2 rounded bg-secondary border border-border">WebM</span>
                </div>

                <button
                  type="button"
                  onClick={() => setAudioUrl(SAMPLE_AUDIO_URL)}
                  className="inline-flex items-center gap-1 text-primary hover:underline self-start sm:self-auto cursor-pointer font-sans"
                >
                  <Sparkles className="h-3 w-3" />
                  Try sample audio link
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Meetings List Section ───────────────────────────────────── */}
      <div className="space-y-4 animate-fade-up stagger-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/80">
          <div className="flex items-center gap-2">
            <Presentation className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Recorded Engineering Sessions</h2>
            <Badge variant="outline" className="font-mono text-xs">
              {filteredMeetings.length}
            </Badge>
          </div>

          {meetings.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search meetings or topics…"
                className="w-full pl-8 pr-3 py-1 text-xs bg-card border border-border rounded-md focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}
        </div>

        {/* Empty state */}
        {meetings.length === 0 && !isActionLoading && (
          <Card className="border-border">
            <CardContent className="py-12 text-center space-y-2.5">
              <div className="h-10 w-10 rounded-md bg-secondary border border-border flex items-center justify-center text-muted-foreground mx-auto">
                <FileAudio className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No meetings processed yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Upload an audio file from your system or paste an audio link above to generate transcriptions and extracted topic chapters.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Meetings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeetings.map((meeting) => (
            <Card
              key={meeting._id}
              onClick={() => navigate(`/projects/${id}/meetings/${meeting._id}`)}
              interactive
              className="flex flex-col justify-between"
            >
              <CardContent className="p-4 space-y-3.5">
                {/* Meeting Header */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="icon-tile h-7.5 w-7.5 rounded shrink-0">
                      <Presentation className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs sm:text-sm text-foreground hover:text-primary transition-colors truncate">
                        {meeting.name || "Untitled Meeting"}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{new Date(meeting.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(meeting._id, e)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    title="Delete Meeting"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Topics Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <span>Discussion Chapters</span>
                    <span>{meeting.issues?.length || 0} topics</span>
                  </div>

                  {meeting.issues && meeting.issues.length > 0 ? (
                    <div className="space-y-1">
                      {meeting.issues.slice(0, 3).map((issue, idx) => (
                        <div
                          key={issue._id || idx}
                          className="flex items-center justify-between p-1.5 rounded bg-secondary/50 border border-border/60 text-xs"
                        >
                          <span className="truncate text-foreground font-medium text-[11px] pr-2">
                            {issue.headline}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                            {issue.start}
                          </span>
                        </div>
                      ))}
                      {meeting.issues.length > 3 && (
                        <p className="text-[10px] text-muted-foreground font-mono pl-1">
                          +{meeting.issues.length - 3} more topics…
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No topics extracted.</p>
                  )}
                </div>

                {/* Footer Link */}
                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-primary font-medium">
                  <span>Explore Meeting Insights</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
