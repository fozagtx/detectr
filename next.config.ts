import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["ali-oss", "@langchain/openai", "@langchain/core", "@langchain/langgraph"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
