import type { NextConfig } from "next";
import os from "node:os";

function getLocalNetworkIps(): string[] {
  const ips: string[] = [];
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === "IPv4" && !iface.internal) {
          ips.push(iface.address);
        }
      }
    }
  } catch {
    // fallback
  }
  return ips;
}

const localIps = getLocalNetworkIps();

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "*.localhost",
    "127.0.0.1",
    ...localIps,
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;

