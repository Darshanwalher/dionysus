import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMeetings, processMeeting, deleteMeeting } from "@/store/slices/projectSlice";
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
  Radio,
  ArrowRight,
  ListOrdered,
} from "lucide-react";

const SAMPLE_AUDIO_URL = "https://actions.google.com/sounds/v1/speech/announcer_voice_sample.ogg";

export default function Meetings() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { meetings, isActionLoading } = useSelector((state) => state.project);
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
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <PageHeader
        icon={Headphones}
        title="Meeting Audio Intelligence"
        description="Transcribe technical discussions, extract architecture decisions, and chat with meeting summaries"
        actions={
          <>
            <Badge
              variant="outline"
              className="text-xs font-mono text-muted-foreground"
            >
              AI Transcription
            </Badge>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 border border-border text-muted-foreground font-mono text-xs">
              <Radio className="h-3.5 w-3.5 text-primary" />
              <span>{meetings.length} Session{meetings.length === 1 ? "" : "s"}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 border border-border text-muted-foreground font-mono text-xs">
              <ListOrdered className="h-3.5 w-3.5 text-primary" />
              <span>{totalTopics} Topic{totalTopics === 1 ? "" : "s"}</span>
            </div>
          </>
        }
      />

      {/* ─── Audio Ingestion & Processing Card ───────────────────────── */}
      <Card className="glass-premium overflow-hidden animate-fade-up">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="icon-tile h-8 w-8 rounded-lg">
              <Mic className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Process New Meeting Audio</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Provide an audio URL (MP3, WAV, M4A, or OGG). The AI will transcribe speech and break discussions into timestamped architectural issues.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleProcess} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="https://example.com/audio/engineering-sync.mp3"
                className="pl-10 text-xs h-10 bg-background/50 border-border/70 focus:border-ring rounded-lg"
                disabled={isActionLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={isActionLoading || !audioUrl.trim()}
              className="h-10 text-xs px-5 font-semibold shrink-0"
            >
              {isActionLoading ? (
                <>
                  <Mic className="h-4 w-4 mr-2 animate-pulse text-primary" />
                  Transcribing Audio…
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 mr-2" />
                  Transcribe & Analyze
                </>
              )}
            </Button>
          </form>

          {/* Formats and Demo helper */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/30 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground">Supported formats:</span>
              <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/40 font-mono">MP3</span>
              <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/40 font-mono">WAV</span>
              <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/40 font-mono">M4A</span>
              <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/40 font-mono">OGG</span>
            </div>

            <button
              type="button"
              onClick={() => setAudioUrl(SAMPLE_AUDIO_URL)}
              className="inline-flex items-center gap-1 text-primary hover:underline self-start sm:self-auto"
            >
              <Sparkles className="h-3 w-3" />
              Try sample audio link
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Meetings List Section ───────────────────────────────────── */}
      <div className="space-y-5 animate-fade-up stagger-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Presentation className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Recorded Meeting Sessions</h2>
            <Badge variant="outline" className="text-xs font-mono ml-1">
              {filteredMeetings.length}
            </Badge>
          </div>

          {meetings.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search meetings or topics…"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/40 border border-border/60 rounded-lg focus:outline-none focus:border-ring text-foreground"
              />
            </div>
          )}
        </div>

        {/* Empty state */}
        {meetings.length === 0 && !isActionLoading && (
          <Card className="glass border-border/50">
            <CardContent className="py-16 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto">
                <FileAudio className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No meetings processed yet</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Paste an audio recording URL in the box above to generate an automated transcription, discussion timestamps, and follow-up AI query support.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Meetings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeetings.map((meeting) => (
            <Card
              key={meeting._id}
              onClick={() => navigate(`/projects/${id}/meetings/${meeting._id}`)}
              interactive
              className="glass cursor-pointer group bg-card/40 flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-4">
                {/* Meeting Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="icon-tile h-9 w-9 rounded-lg shrink-0">
                      <Presentation className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {meeting.name || "Untitled Meeting"}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{new Date(meeting.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(meeting._id, e)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Meeting"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Topics Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Discussion Topics</span>
                    <Badge variant="outline" className="font-mono text-[10px] px-2 py-0">
                      {meeting.issues?.length || 0} topics
                    </Badge>
                  </div>

                  {meeting.issues && meeting.issues.length > 0 ? (
                    <div className="space-y-1.5">
                      {meeting.issues.slice(0, 3).map((issue, idx) => (
                        <div
                          key={issue._id || idx}
                          className="flex items-center justify-between p-2 rounded-md bg-background/50 border border-border/40 text-xs"
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
                <div className="pt-2 border-t border-border/30 flex items-center justify-between text-xs text-primary font-medium group-hover:translate-x-0.5 transition-transform">
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
