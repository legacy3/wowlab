"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { PlayCircle } from "lucide-react";
import { FlaskInlineLoader } from "@/components/ui/flask-loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { setSimcInputAtom } from "@/atoms/sim";

export function QuickSimCard() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const setSimcInput = useSetAtom(setSimcInputAtom);
  const router = useRouter();

  const handleGo = async () => {
    if (!input.trim()) {
      return;
    }

    setLoading(true);
    await setSimcInput(input);
    router.push("/simulate");
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 shrink-0 text-primary" />
          Quick Sim
        </CardTitle>
        <CardDescription>Paste SimC export and go</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={'shaman="Name"\nlevel=80\n...'}
          className="min-h-24 resize-none font-mono text-xs"
        />
        <Button
          onClick={handleGo}
          disabled={!input.trim() || loading}
          className="w-full"
        >
          {loading ? (
            <FlaskInlineLoader className="mr-2 h-4 w-4" />
          ) : (
            <PlayCircle className="mr-2 h-4 w-4" />
          )}
          Go
        </Button>
      </CardContent>
    </Card>
  );
}
