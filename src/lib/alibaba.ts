/**
 * Alibaba Cloud integration proof for Qwen Cloud hackathon submission.
 *
 * This module demonstrates use of Alibaba Cloud services:
 * 1. DashScope / Qwen Cloud APIs via LangChain ChatOpenAI (Singapore intl endpoint)
 * 2. Alibaba Cloud Object Storage Service (OSS) for scene video assets
 *
 * LangChain client: src/lib/langchain.ts
 * LangGraph Agent Society: src/agents/orchestrator.ts
 *
 * Judges: link this file as "Proof of Alibaba Cloud Deployment".
 * Endpoint references:
 * - DashScope chat: https://dashscope-intl.aliyuncs.com/compatible-mode/v1
 * - DashScope video: https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis
 * - OSS: https://help.aliyun.com/document_detail/32018.html
 */

import OSS from "ali-oss";

export const ALIBABA_DASHSCOPE_CHAT_BASE =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

export const ALIBABA_DASHSCOPE_VIDEO_URL =
  "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis";

export const ALIBABA_DASHSCOPE_TASK_URL =
  "https://dashscope-intl.aliyuncs.com/api/v1/tasks";

export function hasOssCredentials(): boolean {
  return Boolean(
    process.env.ALIBABA_OSS_ACCESS_KEY_ID &&
      process.env.ALIBABA_OSS_ACCESS_KEY_SECRET &&
      process.env.ALIBABA_OSS_BUCKET,
  );
}

export function createOssClient(): OSS | null {
  if (!hasOssCredentials()) return null;

  return new OSS({
    region: process.env.ALIBABA_OSS_REGION ?? "oss-ap-southeast-1",
    accessKeyId: process.env.ALIBABA_OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIBABA_OSS_ACCESS_KEY_SECRET!,
    bucket: process.env.ALIBABA_OSS_BUCKET!,
    endpoint: process.env.ALIBABA_OSS_ENDPOINT,
    secure: true,
  });
}

/**
 * Upload a remote video URL (from Wan/HappyHorse) into Alibaba Cloud OSS.
 * Returns a public or signed URL for playback in Detectr.
 */
export async function uploadVideoToOss(params: {
  objectKey: string;
  sourceUrl: string;
}): Promise<{ url: string; bucket: string; objectKey: string } | null> {
  const client = createOssClient();
  if (!client) return null;

  const res = await fetch(params.sourceUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch video for OSS upload: ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());

  const result = await client.put(params.objectKey, buffer, {
    headers: {
      "Content-Type": "video/mp4",
      "x-oss-object-acl": "public-read",
    },
  });

  return {
    url: result.url,
    bucket: process.env.ALIBABA_OSS_BUCKET!,
    objectKey: params.objectKey,
  };
}

export function alibabaCloudProofSummary() {
  return {
    provider: "Alibaba Cloud",
    services: [
      {
        name: "DashScope / Qwen Cloud",
        usage: "LLM agents + Wan/HappyHorse video generation",
        chatBase: ALIBABA_DASHSCOPE_CHAT_BASE,
        videoEndpoint: ALIBABA_DASHSCOPE_VIDEO_URL,
      },
      {
        name: "Object Storage Service (OSS)",
        usage: "Persist generated scene reconstruction videos",
        region: process.env.ALIBABA_OSS_REGION ?? "oss-ap-southeast-1",
        bucket: process.env.ALIBABA_OSS_BUCKET ?? "detectr-videos",
        configured: hasOssCredentials(),
      },
    ],
  };
}
