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
  Sparkles,
  Terminal,
  Code2,
  CornerDownLeft,
} from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "How does authentication and session lifecycle work?",
  "Where are core API endpoints and middleware located?",
  "Explain data models and entity relationships.",
  "Which third-party packages or external services are invoked?",
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
      toast.success("Answer synthesized from AST context!");
    } else {
      toast.error(res.payload || "Failed to query codebase");
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
      toast.success("Query deleted");
    } else {
      toast.error("Failed to delete query");
    }
  };

  const handleCopyAnswer = (q) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = q.answer || "";
    const cleanText = tempDiv.textContent || tempDiv.innerText || "";
    navigator.clipboard.writeText(`Q: ${q.question}\n\nA:\n${cleanText}`);
    setCopiedId(q._id);
    toast.success("Analysis copied to clipboard!");
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
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-up font-sans selection:bg-foreground/15">
      <PageHeader
        icon={Sparkles}
        title="Intelligent Codebase Chat"
        description="Semantic AST question answering · Grounded in repository dependencies and code symbols"
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-secondary border border-border text-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-dot" />
              AST Semantic Indexing
            </span>
            <Badge variant="secondary" className="font-mono text-xs">
              {questions.length} Query{questions.length === 1 ? "" : "s"}
            </Badge>
          </div>
        }
      />

      {/* ─── Ask Question Card ───────────────────────────────────────── */}
      <Card className="card-sheen shadow-2xs">
        <CardContent className="p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground font-mono">
              <Terminal className="h-3.5 w-3.5 text-foreground" />
              <span>Query Repository Knowledge Engine</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
              Ctrl + Enter to send
            </span>
          </div>

          <form onSubmit={handleAsk} className="space-y-3">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about this codebase (e.g., 'How does the authentication middleware validate tokens?')..."
              className="min-h-[90px] text-xs sm:text-sm bg-card p-3 leading-relaxed border-border focus-visible:border-foreground/30 font-sans"
              disabled={isActionLoading}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              {/* Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground font-mono mr-1">
                  Suggested:
                </span>
                {SUGGESTED_QUESTIONS.map((sq, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setQuestion(sq)}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors border border-border text-left cursor-pointer"
                  >
                    {sq.length > 34 ? sq.slice(0, 34) + "…" : sq}
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
                    Analyzing AST Context…
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Execute Query
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ─── Question History & Search Stream ─────────────────────────── */}
      <div className="space-y-4 animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Conversation & Answers</h2>
            <span className="text-[10px] font-mono px-1.5 rounded bg-secondary text-muted-foreground border border-border">
              {filteredQuestions.length}
            </span>
          </div>

          {questions.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search queries and answers…"
                className="w-full pl-8 pr-3 py-1 text-xs bg-card border border-border rounded-md focus:outline-none focus:border-foreground/30 text-foreground placeholder:text-muted-foreground font-sans"
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
            <CardContent className="py-14 text-center space-y-2.5">
              <div className="h-10 w-10 rounded-md border border-border bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                <FileQuestion className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No queries executed yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Ask any question above. Dionysus will trace AST call hierarchies and synthesize a compiler-grounded response.
              </p>
            </CardContent>
          </Card>
        )}

        {/* List of Q&A Cards */}
        <div className="space-y-3.5">
          {filteredQuestions.map((q) => {
            const isCopied = copiedId === q._id;
            return (
              <Card key={q._id} className="overflow-hidden card-sheen">
                <CardContent className="p-4 sm:p-5 space-y-3.5">
                  {/* Question row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="h-7 w-7 rounded-md border border-border bg-secondary flex items-center justify-center text-foreground shrink-0 mt-0.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">
                          Developer Query
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
                            <Check className="h-3 w-3 mr-1 text-emerald-500" />
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
                  <div className="flex items-start gap-2.5 pt-3 border-t border-border">
                    <div className="h-7 w-7 rounded-md bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5 font-bold font-mono text-[10px]">
                      AI
                    </div>
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-foreground font-semibold uppercase">
                          Synthesized Answer
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(q.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Answer Body */}
                      <div
                        className="text-xs text-foreground leading-relaxed font-sans prose prose-xs max-w-none [&_pre]:bg-secondary [&_pre]:border [&_pre]:border-border [&_pre]:p-3 [&_pre]:rounded [&_code]:font-mono [&_p]:my-1.5"
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
