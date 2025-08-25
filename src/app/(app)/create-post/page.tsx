"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function CreatePostPage() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [when, setWhen] = useState<string>("");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Create Post</h1>
      <Card>
        <CardHeader>Composer</CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="#Write your post with hashtags and emojis"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Image (JPEG/PNG up to 10MB)</label>
              <Input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Schedule (ISO date time)</label>
              <Input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button>Save Draft</Button>
            <Button variant="secondary">Schedule</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


