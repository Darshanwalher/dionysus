import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { askQuestion, fetchQuestions, deleteQuestion } from "@/store/slices/projectSlice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  FileQuestion,
  Send,
  Trash2,
  MessageSquare,
  Bot,
  Sparkles,
  Copy,
  Check,
  Search,
  HelpCircle,
  Code2,
  Terminal,
  Zap,
} from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "How does the authentication and session flow work?",
  "Where are the backend API endpoints and controllers located?",
  "Explain the database models and relationships in this project.",
  "What third-party libraries and dependencies are critical here?",
];

export default function QnA() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { questions, isActionLoading } = useSelector((state) => state.project);
  const [question, setQuestion] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    dispatch(fetchQuestions(id));
  }, [dispatch, id]);

  const handleAsk = async (e) => {
    e?.preventDefault();
    if (!question.trim()) return;
    const currentQ = question.trim();
    setQuestion("");
    const res = await dispatch(askQuestion({ projectId: id, question: currentQ }));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Answer received from AI!");
    } else {
      toast.error(res.payload || "Failed to get answer");
      setQuestion(currentQ);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleDelete = async (questionId) => {
    const res = await dispatch(deleteQuestion(questionId));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Question deleted");
    } else {
      toast.error("Failed to delete question");
    }
  };

  const handleCopyAnswer = (q) => {
    // Strip HTML tags for clean text copying
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = q.answer || "";
    const cleanText = tempDiv.textContent || tempDiv.innerText || "";
    navigator.clipboard.writeText(`Q: ${q.question}\n\nA:\n${cleanText}`);
    setCopiedId(q._id);
    toast.success("Answer copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredQuestions = useMemo(() => {
    if (!searchFilter.trim()) return questions;
    const term = searchFilter.toLowerCase();
    return questions.filter(
      (q) =>
        q.question?.toLowerCase().includes(term) ||
        q.answer?.toLowerCase().includes(term)
    );
  }, [questions, searchFilter]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/50">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Codebase Q&A Assistant
              </h1>
              <Badge
                variant="outline"
                className="text-xs font-mono bg-muted/60 border-border text-muted-foreground"
              >
                RAG Vector Search
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ask deep questions about architecture, algorithms, and modules backed by Pinecone vector retrieval
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="secondary" className="font-mono text-xs px-3 py-1">
            {questions.length} Question{questions.length === 1 ? "" : "s"} Recorded
          </Badge>
        </div>
      </div>

      {/* ─── Interactive Ask Question Card ───────────────────────────── */}
      <Card className="glass border-border/60 bg-gradient-to-b from-card/80 to-card/40 shadow-xl overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Ask about any code, logic, or file</span>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline">
              Ctrl + Enter to send
            </span>
          </div>

          <form onSubmit={handleAsk} className="space-y-3">
            <div className="relative">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your codebase (e.g., 'How does the authentication flow work in this repo?')..."
                className="min-h-[110px] resize-none text-sm bg-background/50 border-border/70 focus:border-ring rounded-xl p-4 leading-relaxed"
                disabled={isActionLoading}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              {/* Suggested Quick Prompt Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground font-medium mr-1 flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-400" /> Suggestions:
                </span>
                {SUGGESTED_QUESTIONS.map((sq, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setQuestion(sq)}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors border border-border/40 text-left"
                  >
                    {sq.length > 38 ? sq.slice(0, 38) + "…" : sq}
                  </button>
                ))}
              </div>

              <Button
                type="submit"
                disabled={isActionLoading || !question.trim()}
                className="h-10 px-5 text-xs font-semibold shrink-0"
              >
                {isActionLoading ? (
                  <>
                    <Bot className="h-4 w-4 mr-2 animate-bounce" />
                    Searching Codebase…
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-2" />
                    Ask Assistant
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ─── Question History & Search Stream ─────────────────────────── */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Conversation History</h2>
            <Badge variant="outline" className="text-xs font-mono ml-1">
              {filteredQuestions.length}
            </Badge>
          </div>

          {questions.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search questions & answers…"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/40 border border-border/60 rounded-lg focus:outline-none focus:border-ring text-foreground"
              />
            </div>
          )}
        </div>

        {/* Loading skeleton while fetching */}
        {isActionLoading && questions.length === 0 && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl bg-muted/30" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {questions.length === 0 && !isActionLoading && (
          <Card className="glass border-border/50">
            <CardContent className="py-16 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto">
                <FileQuestion className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No questions asked yet</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Use the input above to ask any question about your codebase. The AI will search your vectorized files and provide structured, code-informed answers.
              </p>
            </CardContent>
          </Card>
        )}

        {/* List of Q&A Cards */}
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const isCopied = copiedId === q._id;
            return (
              <Card
                key={q._id}
                className="glass border-border/50 hover:border-primary/50 transition-all bg-card/40 overflow-hidden"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Question row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground shrink-0 mt-0.5">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider font-semibold">
                          Question
                        </span>
                        <h3 className="text-sm font-semibold text-foreground leading-snug">
                          {q.question}
                        </h3>
                      </div>
                    </div>

                    {/* Actions: Copy & Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyAnswer(q)}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground border border-border/40"
                        title="Copy question and answer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(q._id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive border border-border/40"
                        title="Delete question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border/30 my-2" />

                  {/* AI Answer Block */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono text-emerald-400/90 tracking-wider font-semibold">
                          AI Codebase Reasoning
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(q.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Answer Body */}
                      <div
                        className="text-xs text-foreground/90 leading-relaxed font-sans prose prose-xs max-w-none [&_pre]:bg-muted [&_pre]:border [&_pre]:border-border [&_pre]:p-3 [&_pre]:rounded-lg [&_code]:text-primary [&_code]:font-mono [&_p]:my-1.5"
                        dangerouslySetInnerHTML={{ __html: q.answer }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
