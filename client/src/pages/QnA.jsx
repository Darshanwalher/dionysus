import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { askQuestion, fetchQuestions, deleteQuestion } from "@/store/slices/projectSlice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileQuestion, Send, Trash2, MessageSquare, Bot } from "lucide-react";

export default function QnA() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { questions, isActionLoading } = useSelector((state) => state.project);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    dispatch(fetchQuestions(id));
  }, [dispatch, id]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    await dispatch(askQuestion({ projectId: id, question }));
    setQuestion("");
  };

  const handleDelete = (questionId) => {
    dispatch(deleteQuestion(questionId));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <FileQuestion className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Ask about your codebase</h1>
      </div>

      {/* Ask Question Card */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Ask a Question
          </CardTitle>
          <CardDescription>
            Ask any question about your codebase and get an AI-powered answer
            based on your repository's content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAsk} className="space-y-3">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., How does the authentication flow work?"
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={isActionLoading}>
                <Send className="h-4 w-4 mr-2" />
                Ask Question
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Q&A History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">
          Question History
        </h2>

        {isActionLoading && questions.length === 0 && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        )}

        {questions.length === 0 && !isActionLoading && (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No questions asked yet. Start by asking something about your
                codebase!
              </p>
            </CardContent>
          </Card>
        )}

        {questions.map((q) => (
          <Card
            key={q._id}
            className="glass border-border/50 hover:border-primary/20 transition-colors"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <p className="font-medium text-sm">{q.question}</p>
                  </div>
                  <div className="flex items-start gap-2 ml-6">
                    <Bot className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                    <div
                      className="text-sm text-muted-foreground prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: q.answer }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(q._id)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-3 ml-6">
                {new Date(q.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
