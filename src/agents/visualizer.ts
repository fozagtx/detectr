import {
  ALIBABA_DASHSCOPE_TASK_URL,
  ALIBABA_DASHSCOPE_VIDEO_URL,
  uploadVideoToOss,
} from "@/lib/alibaba";
import { requireQwenKey } from "@/lib/langchain";
import type { SceneVideo, Shot } from "@/lib/types";

const VIDEO_MODEL = process.env.WAN_MODEL ?? "happyhorse-1.1-t2v";

async function submitVideoTask(prompt: string, durationSec: number): Promise<string> {
  const apiKey = requireQwenKey();

  const res = await fetch(ALIBABA_DASHSCOPE_VIDEO_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable",
    },
    body: JSON.stringify({
      model: VIDEO_MODEL,
      input: { prompt },
      parameters: {
        resolution: "720P",
        ratio: "16:9",
        duration: Math.min(Math.max(durationSec, 3), 10),
      },
    }),
  });

  const json = (await res.json()) as {
    output?: { task_id?: string };
    code?: string;
    message?: string;
  };

  if (!res.ok || !json.output?.task_id) {
    throw new Error(json.message ?? `Video submit failed: ${res.status}`);
  }
  return json.output.task_id;
}

async function pollTask(
  taskId: string,
  maxAttempts = 60,
): Promise<string> {
  const apiKey = requireQwenKey();
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`${ALIBABA_DASHSCOPE_TASK_URL}/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const json = (await res.json()) as {
      output?: {
        task_status?: string;
        video_url?: string;
        message?: string;
      };
    };
    const status = json.output?.task_status;
    if (status === "SUCCEEDED") {
      const url = json.output?.video_url;
      if (!url) throw new Error("Video succeeded but no video_url returned");
      return url;
    }
    if (status === "FAILED") {
      throw new Error(json.output?.message ?? "Video generation failed");
    }
  }
  throw new Error("Video generation timed out");
}

/** Live Wan/HappyHorse generation only — no mock/placeholder videos. */
export async function visualizeScenes(shots: Shot[]): Promise<SceneVideo[]> {
  requireQwenKey();

  if (!shots.length) {
    throw new Error("Visualizer: no shots to generate.");
  }

  const videos: SceneVideo[] = [];

  for (const shot of shots) {
    const taskId = await submitVideoTask(shot.prompt, shot.durationSec);
    let url = await pollTask(taskId);

    try {
      const oss = await uploadVideoToOss({
        objectKey: `detectr/${shot.id}-${Date.now()}.mp4`,
        sourceUrl: url,
      });
      if (oss?.url) url = oss.url;
    } catch {
      // DashScope URL is still a live asset
    }

    videos.push({
      id: `vid-${shot.id}`,
      shotId: shot.id,
      title: shot.title,
      prompt: shot.prompt,
      status: "succeeded",
      taskId,
      url,
    });
  }

  return videos;
}
