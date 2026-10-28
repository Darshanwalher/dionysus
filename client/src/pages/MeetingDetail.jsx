import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import {
  Clock,
  Send,
  Bot,
  ChevronRight,
  ArrowLeft,
  Presentation,
  Sparkles,
  Copy,
  Check,
  ListOrdered,
  FileText,
  Search,
} from "lucide-react";

export default function MeetingDetail() {
  const { id, meetingId } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [topicSearch, setTopicSearch] = useState("");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const { data } = await api.get(`/meetings/${meetingId}`);
        setMeeting(data.data);
        if (data.data?.issues?.length > 0) {
          setSelectedIssue(data.data.issues[0]);
        }
      } catch (error) {
        console.error("Failed to fetch meeting:", error);
        toast.error("Failed to load meeting details");
      } finally {
        setLoading(false);
      }
    };
    fetchMeeting();
  }, [meetingId]);

  const handleAskIssue = async (e) => {
    e?.preventDefault();
    if (!query.trim() || !selectedIssue) return;
    setAsking(true);
    try {
      const { data } = await api.post(
        `/meetings/${meetingId}/issues/${selectedIssue._id}/ask`,
        { query: query.trim() }
      );
      setAnswer(data.data.answer);
      toast.success("Answer received!");
    } catch {
      setAnswer("Failed to get an answer. Please try again.");
      toast.error("Failed to query meeting issue");
    } finally {
      setAsking(false);
    }
  };

  const handleCopyAnswer = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopiedAnswer(true);
    toast.success("Answer copied to clipboard!");
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  const filteredIssues = useMemo(() => {
    if (!meeting?.issues) return [];
    if (!topicSearch.trim()) return meeting.issues;
    const term = topicSearch.toLowerCase();
    return meeting.issues.filter(
      (iss) =>
        iss.headline?.toLowerCase().includes(term) ||
        iss.gist?.toLowerCase().includes(term) ||
        iss.summary?.toLowerCase().includes(term)
    );
  }, [meeting?.issues, topicSearch]);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-5 h-[650px] rounded-xl" />
          <Skeleton className="lg:col-span-7 h-[650px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="w-full max-w-7xl mx-auto text-center py-20 space-y-4">
        <Presentation className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
        <h2 className="text-xl font-bold">Meeting Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested meeting recording could not be loaded.</p>
        <Link to={`/projects/${id}/meetings`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meetings
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={Presentation}
        title={meeting.name}
        description={`Processed on ${new Date(meeting.createdAt).toLocaleString()}`}
        actions={
          <>
            <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
              {meeting.issues?.length || 0} Topics Extracted
            </Badge>
            <Link to={`/projects/${id}/meetings`}>
              <Button variant="outline" size="sm" className="h-8 text-xs border-border/60">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                All Meetings
              </Button>
            </Link>
          </>
        }
      />

      {/* ─── Master-Detail Layout ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-up">
        {/* Left Column (5 cols): Topics List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <ListOrdered className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Discussion Topics</span>
              <Badge variant="secondary" className="font-mono text-[10px] ml-1">
                {filteredIssues.length}
              </Badge>
            </div>

            <div className="relative w-44">
              <Search className="h-3 w-3 absolute left-2.5 top-2 text-muted-foreground" />
              <input
                type="text"
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                placeholder="Filter topics…"
                className="w-full pl-7 pr-2 py-1 text-xs bg-muted/40 border border-border/60 rounded-md focus:outline-none focus:border-ring text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredIssues.map((issue) => {
              const isSelected = selectedIssue?._id === issue._id;
              return (
                <Card
                  key={issue._id}
                  onClick={() => {
                    setSelectedIssue(issue);
                    setAnswer("");
                    setQuery("");
                  }}
                  interactive={!isSelected}
                  className={`glass cursor-pointer border ${
                    isSelected
                      ? "border-primary/50 bg-primary/8 shadow-sm ring-1 ring-primary/30"
                      : "border-border/50 bg-card/40"
                  }`}
                >
                  <CardContent className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-mono px-2 py-0.5 flex items-center gap-1 bg-muted text-muted-foreground"
                      >
                        <Clock className="h-2.5 w-2.5 text-primary" />
                        {issue.start} — {issue.end}
                      </Badge>

                      <ChevronRight
                        className={`h-3.5 w-3.5 transition-colors ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </div>

                    <h3 className="text-xs font-semibold text-foreground leading-snug">
                      {issue.headline}
                    </h3>

                    {issue.gist && (
                      <p className="text-[11px] text-primary/90 font-medium line-clamp-1">
                        {issue.gist}
                      </p>
                    )}

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {issue.summary}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 cols): Deep Dive Detail Panel */}
        <div className="lg:col-span-7">
          {selectedIssue ? (
            <Card className="glass-premium">
              <CardHeader className="pb-4 border-b border-border/40">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-xs font-mono px-2.5 py-0.5 flex items-center gap-1.5 bg-muted text-foreground"
                      >
                        <Clock className="h-3 w-3 text-primary" />
                        Timestamp: {selectedIssue.start} — {selectedIssue.end}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground leading-snug">
                      {selectedIssue.headline}
                    </CardTitle>
                    {selectedIssue.gist && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{selectedIssue.gist}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Discussion Summary */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Discussion Summary</span>
                  </div>
                  <div className="p-4 rounded-xl bg-background/50 border border-border/50 text-xs text-foreground/90 leading-relaxed font-sans whitespace-pre-wrap">
                    {selectedIssue.summary}
                  </div>
                </div>

                {/* AI Follow-up Question Assistant */}
                <div className="space-y-3 pt-4 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Bot className="h-4 w-4 text-primary" />
                      <span>Ask AI Follow-Up Question</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Query topic transcript
                    </span>
                  </div>

                  {/* Suggestion pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setQuery("What specific action items or tasks were assigned?")}
                      className="text-[11px] px-2 py-0.5 rounded bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-border/40"
                    >
                      Action items assigned?
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuery("What technical decisions or tradeoffs were made?")}
                      className="text-[11px] px-2 py-0.5 rounded bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-border/40"
                    >
                      Technical tradeoffs?
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuery("Can you summarize the main arguments discussed here?")}
                      className="text-[11px] px-2 py-0.5 rounded bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-border/40"
                    >
                      Main arguments?
                    </button>
                  </div>

                  <form onSubmit={handleAskIssue} className="space-y-2.5">
                    <Textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask a question about what was discussed in this section..."
                      className="min-h-[80px] resize-none text-xs bg-background/50 border-border/60 rounded-lg p-3"
                      disabled={asking}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={asking || !query.trim()}
                        className="h-8 text-xs px-4"
                      >
                        {asking ? (
                          <>
                            <Bot className="h-3.5 w-3.5 mr-1.5 animate-bounce" />
                            Analyzing…
                          </>
                        ) : (
                          <>
                            <Send className="h-3 w-3 mr-1.5" />
                            Ask Question
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  {/* AI Response Display */}
                  {answer && (
                    <div className="p-4 rounded-xl bg-muted/90 border border-border space-y-2 animate-fade-up">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-primary font-semibold font-mono">
                          <Bot className="h-3.5 w-3.5" />
                          <span>AI Answer</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyAnswer}
                          className="h-6 text-[10px] text-muted-foreground hover:text-foreground px-2"
                        >
                          {copiedAnswer ? (
                            <>
                              <Check className="h-3 w-3 mr-1 text-primary" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copy Answer
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed font-sans whitespace-pre-wrap">
                        {answer}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass border-border/50">
              <CardContent className="py-20 text-center space-y-2 text-muted-foreground">
                <ListOrdered className="h-8 w-8 mx-auto opacity-50" />
                <p className="text-xs">Select a topic from the left to view detailed insights and ask AI questions.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
