"use client";

import { useAtom, useSetAtom } from "jotai";
import { AlertCircle, Loader2, Pause, Play, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import {
  cancelJobAtom,
  jobsAtom,
  toggleJobAtom,
  PHASE_LABELS,
} from "@/atoms/computing";

export function QueueCard() {
  const [jobs] = useAtom(jobsAtom);
  const setToggleJob = useSetAtom(toggleJobAtom);
  const setCancelJob = useSetAtom(cancelJobAtom);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Queue</CardTitle>
        <CardDescription>
          Drag and drop to reorder simulation jobs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{job.name}</h3>
                      <Badge
                        variant={
                          job.status === "running"
                            ? "default"
                            : job.status === "queued"
                              ? "secondary"
                              : job.status === "failed"
                                ? "destructive"
                                : "outline"
                        }
                      >
                        {job.status === "running" && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        {job.status === "failed" && (
                          <AlertCircle className="mr-1 h-3 w-3" />
                        )}
                        {job.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {PHASE_LABELS[job.phase]}
                      </Badge>
                    </div>
                    {job.phaseDetail && (
                      <p className="text-xs text-muted-foreground">
                        {job.phaseDetail}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {job.current} simulations • ETA: {job.eta}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {(job.status === "running" || job.status === "paused") && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setToggleJob(job.id)}
                        >
                          {job.status === "running" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCancelJob(job.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {job.status === "queued" && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setToggleJob(job.id)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCancelJob(job.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {job.status === "completed" && (
                      <Button variant="outline" size="sm">
                        View Results
                      </Button>
                    )}
                  </div>
                </div>
                {job.status !== "completed" && (
                  <div className="space-y-2">
                    <Progress value={job.progress} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{job.progress}%</span>
                      <span>{job.current}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
