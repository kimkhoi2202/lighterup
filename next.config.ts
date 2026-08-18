import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        optimizePackageImports: ["@untitledui/icons"],
    },
    // Exclude the reference project directory from the build
    webpack: (config) => {
        // Ignore the reference project directory from watching
        config.watchOptions = {
            ...config.watchOptions,
            ignored: [
                '**/node_modules/**',
                '**/.next/**',
                '**/next13-discord-clone-master/**',
            ],
        };
        return config;
    },
};

export default nextConfig;
