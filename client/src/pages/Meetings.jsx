import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMeetings, processMeeting, deleteMeeting } from "@/store/slices/projectSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Presentation,
  Upload,
  Link2,
  Trash2,
  Clock,
  ExternalLink,
  Mic,
} from "lucide-react";

export default function Meetings() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { meetings, isActionLoading } = useSelector((state) => state.project);
  const [audioUrl, setAudioUrl] = useState("");

  useEffect(() => {
    dispatch(fetchMeetings(id));
  }, [dispatch, id]);

  const handleProcess = async (e) => {
    e.preventDefault();
    if (!audioUrl.trim()) return;
    const result = await dispatch(processMeeting({ projectId: id, audio_url: audioUrl }));
    if (result.meta.requestStatus === "fulfilled") {
      setAudioUrl("");
    }
  };

  const handleDelete = (meetingId) => {
    dispatch(deleteMeeting(meetingId));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Presentation className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Meetings</h1>
      </div>

      {/* Upload Meeting */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Process Meeting Audio
          </CardTitle>
          <CardDescription>
            Provide a URL to your meeting audio file (mp3/mp4). The AI will
            transcribe it and extract key discussion topics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProcess} className="flex gap-3">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="https://example.com/meeting.mp3"
                className="pl-10"
              />
            </div>
            <Button type="submit" isLoading={isActionLoading}>
              <Mic className="h-4 w-4 mr-2" />
              Transcribe
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Meetings List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">
          Past Meetings
        </h2>

        {meetings.length === 0 && (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center">
              <Presentation className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No meetings processed yet. Upload a meeting audio to get started.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {meetings.map((meeting) => (
            <Card
              key={meeting._id}
              className="glass border-border/50 hover:border-primary/30 transition-all duration-200 cursor-pointer group"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1"
                    onClick={() =>
                      navigate(`/projects/${id}/meetings/${meeting._id}`)
                    }
                  >
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {meeting.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(meeting.createdAt).toLocaleDateString()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {meeting.issues?.length || 0} topics
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(meeting._id);
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
