import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
            },
        ],
        qualities: [25, 50, 75, 100],
    },
};

export default nextConfig;
