import type { NextConfig } from "next";
import os from "os";

function getLocalSubnet(): string[] {
  const origins: string[] = []
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        // Allow any port on this IP so mobile can reach the dev server
        origins.push(`http://${net.address}`)
        origins.push(`http://${net.address}:3000`)
        origins.push(`http://${net.address}:3001`)
      }
    }
  }
  return origins
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getLocalSubnet(),
};

export default nextConfig;
