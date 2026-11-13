import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import gsap from "gsap";
import { askQuestion, fetchQuestions, deleteQuestion } from "@/store/slices/projectSlice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import RichAnswer from "@/components/code/RichAnswer";
import { FadeIn, Magnetic, Pop, SweepBar, prefersReduced } from "@/components/motion";
import { cn } from "@/lib/utils";
import {
  FileQuestion,
  Send,
  Trash2,
  MessageSquare,
  Copy,
  Check,
  Search,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "How does authentication and session lifecycle work?",
  "Where are core API endpoints and middleware located?",
  "Explain data models and entity relationships.",
  "Which third-party packages or external services are invoked?",
];

const THINKING_STEPS = [
  "Tracing the dependency graph",
  "Reading relevant symbols",
  "Grounding the answer in your code",
  "Writing the answer",
];

/** Cycling status line shown while an answer is being generated. */
function Thinking() {
  const [i, setI] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % THINKING_STEPS.length), 1800);
    return () => clearInterval(t);
  }, []);
  useLayoutEffect(() => {
    if (!ref.current || prefersReduced()) return;
    const t = gsap.fromTo(ref.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
    return () => t.kill();
  }, [i]);
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground" role="status">
      <span className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((d) => (
          <span key={d} className="h-1.5 w-1.5 rounded-full bg-highlight animate-pulse-dot" style={{ animationDelay: `${d * 0.2}s` }} />
        ))}
      </span>
      <span ref={ref}>{THINKING_STEPS[i]}…</span>
    </div>
  );
}

/** One question + answer. Fresh answers get a soft highlight and a staggered reveal. */
const AnswerCard = memo(function AnswerCard({ q, fresh, copied, onCopy, onDelete, index }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (!fresh || !ref.current || prefersReduced()) return;
    const t = gsap.fromTo(
      ref.current,
      { boxShadow: "0 0 0 4px rgba(255,104,69,0.35)" },
      { boxShadow: "0 0 0 0px rgba(255,104,69,0)", duration: 1.6, ease: "power2.out", clearProps: "boxShadow" }
    );
    return () => t.kill();
  }, [fresh]);

  const remove = () => {
    if (!ref.current || prefersReduced()) {
      onDelete(q._id);
      return;
    }
    const el = ref.current;
    el.style.overflow = "hidden";
    gsap.to(el, {
      height: 0,
      opacity: 0,
      paddingTop: 0,
      paddingBottom: 0,
      borderWidth: 0,
      duration: 0.35,
      ease: "power2.inOut",
      onComplete: () => onDelete(q._id),
    });
  };

  return (
    <FadeIn delay={fresh ? 0 : Math.min(index, 6) * 0.04}>
      <article
        ref={ref}
        style={fresh ? undefined : { contentVisibility: "auto", containIntrinsicSize: "auto 320px" }}
        className={cn("overflow-hidden rounded-2xl border bg-card", fresh ? "border-primary/50" : "border-border")}
      >
        {/* Question */}
        <header className="flex items-start justify-between gap-3 p-5 pb-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                You asked · {new Date(q.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
              <h3 className="mt-0.5 break-words text-[15px] font-semibold leading-snug text-foreground">{q.question}</h3>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onCopy(q)}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Copy question and answer"
            >
              {copied ? <Pop><Check className="h-3.5 w-3.5 text-accent-emerald" /></Pop> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              type="button"
              onClick={remove}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Delete question"
              aria-label="Delete question"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Answer */}
        <div className="border-t border-border bg-secondary/30 px-5 py-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold text-foreground">Dionysus</span>
            <span className="text-[11px] text-muted-foreground">answered from your code</span>
          </div>
          <RichAnswer html={q.answer} animate={fresh} />
        </div>
      </article>
    </FadeIn>
  );
});

export default function QnA() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { questions, isActionLoading } = useSelector((state) => state.project);
  const [question, setQuestion] = useState(searchParams.get("q") || "");
  const [pending, setPending] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [freshIds, setFreshIds] = useState(() => new Set());

  const typer = useRef(null);
  const prevIds = useRef(new Set());
  const justAsked = useRef(false);

  useEffect(() => {
    const qParam = searchParams.get("q");
    if (qParam) setQuestion(qParam);
  }, [searchParams]);

  useEffect(() => {
    dispatch(fetchQuestions(id));
  }, [dispatch, id]);

  // After you ask, mark the newly added answer(s) as "fresh" so they animate in
  useEffect(() => {
    const cur = new Set(questions.map((q) => q._id));
    if (justAsked.current) {
      const added = [...cur].filter((x) => !prevIds.current.has(x));
      if (added.length) {
        setFreshIds(new Set(added));
        justAsked.current = false;
      }
    }
    prevIds.current = cur;
  }, [questions]);

  // Newest-first lists show the pending card on top, oldest-first lists at the bottom
  const newestFirst = useMemo(() => {
    if (questions.length < 2) return true;
    return new Date(questions[0].createdAt) >= new Date(questions[questions.length - 1].createdAt);
  }, [questions]);

  const handleAsk = async (e) => {
    e?.preventDefault();
    if (!question.trim() || isActionLoading) return;
    const currentQ = question.trim();
    setQuestion("");
    setPending(currentQ);
    justAsked.current = true;
    const res = await dispatch(askQuestion({ projectId: id, question: currentQ }));
    setPending(null);
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Answer synthesized from AST context!");
    } else {
      justAsked.current = false;
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

  // Suggested questions type themselves into the box
  const typeInto = (text) => {
    if (isActionLoading) return;
    if (typer.current) typer.current.kill();
    document.getElementById("qna-input")?.focus();
    if (prefersReduced()) {
      setQuestion(text);
      return;
    }
    const o = { n: 0 };
    typer.current = gsap.to(o, {
      n: text.length,
      duration: Math.min(0.7, text.length * 0.012),
      ease: "none",
      onUpdate: () => setQuestion(text.slice(0, Math.round(o.n))),
    });
  };
  useEffect(() => () => typer.current?.kill(), []);

  const handleDelete = useCallback(
    async (questionId) => {
      const res = await dispatch(deleteQuestion(questionId));
      if (res.meta.requestStatus === "fulfilled") {
        toast.success("Query deleted");
      } else {
        toast.error("Failed to delete query");
      }
    },
    [dispatch]
  );

  const handleCopyAnswer = useCallback((q) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = q.answer || "";
    const cleanText = tempDiv.textContent || tempDiv.innerText || "";
    navigator.clipboard.writeText(`Q: ${q.question}\n\nA:\n${cleanText}`);
    setCopiedId(q._id);
    toast.success("Analysis copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const filteredQuestions = useMemo(() => {
    if (!searchFilter.trim()) return questions;
    const term = searchFilter.toLowerCase();
    return questions.filter((q) => q.question?.toLowerCase().includes(term) || q.answer?.toLowerCase().includes(term));
  }, [questions, searchFilter]);

  const pendingCard = pending && (
    <FadeIn key="pending">
      <article className="overflow-hidden rounded-2xl border border-primary/40 bg-card">
        <header className="flex items-start gap-3 p-5 pb-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">You asked · just now</p>
            <h3 className="mt-0.5 break-words text-[15px] font-semibold leading-snug text-foreground">{pending}</h3>
          </div>
        </header>
        <div className="space-y-3 border-t border-border bg-secondary/30 px-5 py-4">
          <Thinking />
          <Skeleton className="h-3 w-5/6 rounded" />
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>
      </article>
    </FadeIn>
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        icon={Sparkles}
        title="Codebase chat"
        description="Ask questions in plain English. Answers are grounded in your repository's symbols and dependencies."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse-dot" />
            Index ready · {questions.length} question{questions.length === 1 ? "" : "s"}
          </span>
        }
      />

      {/* ─── Composer ─────────────────────────────────────────── */}
      <FadeIn>
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_32px_-20px_rgba(16,33,31,0.35)] transition-colors focus-within:border-primary/50">
          <SweepBar active={isActionLoading} />
          <form onSubmit={handleAsk} className="space-y-3 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <label htmlFor="qna-input" className="text-[13px] font-semibold text-foreground">
                Ask your codebase
              </label>
              <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex">
                <kbd>Ctrl</kbd>
                <kbd>↵</kbd>
                to send
              </span>
            </div>

            <Textarea
              id="qna-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="How does the authentication middleware validate tokens?"
              className="min-h-[96px] resize-none rounded-xl border-border bg-surface-elevated p-3.5 text-sm leading-relaxed focus-visible:ring-0"
              disabled={isActionLoading}
            />

            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-wrap items-center gap-1.5">
                {SUGGESTED_QUESTIONS.map((sq) => (
                  <button
                    key={sq}
                    type="button"
                    onClick={() => typeInto(sq)}
                    disabled={isActionLoading}
                    title={sq}
                    className="cursor-pointer rounded-full border border-border bg-secondary/60 px-3 py-1 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sq.length > 38 ? sq.slice(0, 38) + "…" : sq}
                  </button>
                ))}
              </div>

              <Magnetic strength={0.2} className="shrink-0 self-end">
                <Button type="submit" disabled={isActionLoading || !question.trim()} className="h-9 rounded-lg px-4 text-xs font-semibold">
                  {isActionLoading ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Ask
                    </>
                  )}
                </Button>
              </Magnetic>
            </div>
          </form>
        </section>
      </FadeIn>

      {/* ─── Conversation ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 border-b border-border pb-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">Conversation</h2>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {filteredQuestions.length}
            </span>
          </div>

          {questions.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search questions and answers"
                aria-label="Search questions and answers"
                className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary/50 focus:outline-none"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Empty state */}
        {questions.length === 0 && !pending && (
          <FadeIn>
            <div className="rounded-2xl border border-dashed border-border bg-card/50 py-14 text-center">
              <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                <FileQuestion className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-semibold text-foreground">No questions yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Ask anything above. Dionysus traces call hierarchies and answers with the code it found.
              </p>
            </div>
          </FadeIn>
        )}

        {searchFilter && filteredQuestions.length === 0 && questions.length > 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">No questions match “{searchFilter}”.</p>
        )}

        <div className="space-y-4">
          {newestFirst && pendingCard}
          {filteredQuestions.map((q, i) => (
            <AnswerCard
              key={q._id}
              q={q}
              index={i}
              fresh={freshIds.has(q._id)}
              copied={copiedId === q._id}
              onCopy={handleCopyAnswer}
              onDelete={handleDelete}
            />
          ))}
          {!newestFirst && pendingCard}
        </div>
      </section>
    </div>
  );
}