import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  MessageSquare,
  Send,
  Bot,
  X,
  ChevronRight,
} from "lucide-react";

export default function MeetingDetail() {
  const { id, meetingId } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const { data } = await api.get(`/meetings/${meetingId}`);
        setMeeting(data.data);
      } catch (error) {
        console.error("Failed to fetch meeting:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMeeting();
  }, [meetingId]);

  const handleAskIssue = async (e) => {
    e.preventDefault();
    if (!query.trim() || !selectedIssue) return;
    setAsking(true);
    try {
      const { data } = await api.post(
        `/meetings/${meetingId}/issues/${selectedIssue._id}/ask`,
        { query }
      );
      setAnswer(data.data.answer);
    } catch (error) {
      setAnswer("Failed to get an answer. Please try again.");
    } finally {
      setAsking(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Meeting not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">{meeting.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Processed on {new Date(meeting.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Issues Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {meeting.issues?.map((issue) => (
          <Card
            key={issue._id}
            className="glass border-border/50 hover:border-primary/30 transition-all duration-200 cursor-pointer group"
            onClick={() => {
              setSelectedIssue(issue);
              setAnswer("");
              setQuery("");
            }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {issue.start} — {issue.end}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {issue.headline}
                  </h3>
                  <p className="text-xs text-primary/80 font-medium">
                    {issue.gist}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {issue.summary}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Issue Modal/Panel */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedIssue(null)}
          />
          <Card className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto glass border-primary/20">
            <CardHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 border-b border-border">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Badge variant="secondary" className="text-xs mb-2">
                    <Clock className="h-3 w-3 mr-1" />
                    {selectedIssue.start} — {selectedIssue.end}
                  </Badge>
                  <CardTitle className="text-lg">{selectedIssue.headline}</CardTitle>
                  <p className="text-sm text-primary/80">{selectedIssue.gist}</p>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground">{selectedIssue.summary}</p>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Ask about this topic
                </h4>
                <form onSubmit={handleAskIssue} className="space-y-3">
                  <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a follow-up question about this discussion point..."
                    className="min-h-[80px] resize-none"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" isLoading={asking}>
                      <Send className="h-3 w-3 mr-2" />
                      Ask
                    </Button>
                  </div>
                </form>

                {answer && (
                  <div className="mt-4 p-4 rounded-lg bg-accent/50 border border-accent">
                    <div className="flex items-start gap-2">
                      <Bot className="h-4 w-4 mt-1 text-primary shrink-0" />
                      <p className="text-sm text-muted-foreground">{answer}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
