import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { askQuestion, fetchQuestions, deleteQuestion } from "@/store/slices/projectSlice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import {
  FileQuestion,
  Send,
  Trash2,
  MessageSquare,
  Bot,
  Copy,
  Check,
  Search,
  Loader2,
} from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "How does authentication and session flow work?",
  "Where are backend API routes and controllers located?",
  "Explain database models and relationships.",
  "What third-party dependencies are critical here?",
];

export default function QnA() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { questions, isActionLoading } = useSelector((state) => state.project);
  const [question, setQuestion] = useState(searchParams.get("q") || "");
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const qParam = searchParams.get("q");
    if (qParam) {
      setQuestion(qParam);
    }
  }, [searchParams]);

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
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={Bot}
        title="Codebase Q&A Assistant"
        description="Natural language developer queries grounded in vectorized repository context"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              RAG Vector Search
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs">
              {questions.length} Question{questions.length === 1 ? "" : "s"}
            </Badge>
          </div>
        }
      />

      {/* ─── Ask Question Card ───────────────────────────────────────── */}
      <Card className="animate-fade-up">
        <CardContent className="p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Bot className="h-4 w-4 text-primary" />
              <span>Query repository knowledge</span>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline">
              Ctrl + Enter to send
            </span>
          </div>

          <form onSubmit={handleAsk} className="space-y-3">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about this codebase (e.g., 'How does authentication flow work?')..."
              className="min-h-[90px] text-xs sm:text-sm bg-card p-3 leading-relaxed"
              disabled={isActionLoading}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              {/* Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground font-mono mr-1">
                  Suggestions:
                </span>
                {SUGGESTED_QUESTIONS.map((sq, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setQuestion(sq)}
                    className="text-[11px] px-2 py-0.5 rounded bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border text-left cursor-pointer"
                  >
                    {sq.length > 36 ? sq.slice(0, 36) + "…" : sq}
                  </button>
                ))}
              </div>

              <Button
                type="submit"
                disabled={isActionLoading || !question.trim()}
                className="h-8.5 px-4 text-xs font-semibold shrink-0"
              >
                {isActionLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Searching Codebase…
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Ask Assistant
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ─── Question History & Search Stream ─────────────────────────── */}
      <div className="space-y-4 animate-fade-up stagger-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/80">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Conversation History</h2>
            <Badge variant="outline" className="text-xs font-mono">
              {filteredQuestions.length}
            </Badge>
          </div>

          {questions.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search questions & answers…"
                className="w-full pl-8 pr-3 py-1 text-xs bg-card border border-border rounded-md focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {isActionLoading && questions.length === 0 && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-md" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {questions.length === 0 && !isActionLoading && (
          <Card className="border-border">
            <CardContent className="py-12 text-center space-y-2.5">
              <div className="icon-tile h-10 w-10 rounded-md mx-auto">
                <FileQuestion className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No questions asked yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Use the input above to ask any question about your codebase. The AI will search your vectorized files and provide grounded, code-informed answers.
              </p>
            </CardContent>
          </Card>
        )}

        {/* List of Q&A Cards */}
        <div className="space-y-3.5">
          {filteredQuestions.map((q) => {
            const isCopied = copiedId === q._id;
            return (
              <Card key={q._id} className="overflow-hidden">
                <CardContent className="p-4 sm:p-5 space-y-3.5">
                  {/* Question row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="icon-tile h-7 w-7 rounded shrink-0 mt-0.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">
                          Question
                        </span>
                        <h3 className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
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
                        className="h-7 text-xs text-muted-foreground hover:text-foreground border border-border"
                        title="Copy question and answer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 mr-1 text-primary" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(q._id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive border border-border"
                        title="Delete question"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* AI Answer Block */}
                  <div className="flex items-start gap-2.5 pt-2 border-t border-border/50">
                    <div className="h-7 w-7 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-primary font-semibold uppercase">
                          AI Codebase Reasoning
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(q.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Answer Body */}
                      <div
                        className="text-xs text-foreground leading-relaxed font-sans prose prose-xs max-w-none [&_pre]:bg-secondary [&_pre]:border [&_pre]:border-border [&_pre]:p-3 [&_pre]:rounded [&_code]:text-primary [&_code]:font-mono [&_p]:my-1.5"
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
