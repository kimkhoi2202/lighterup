"use client";

import { useEffect, useState } from "react";

interface Snowflake {
    id: number;
    left: number;
    animationDuration: number;
    opacity: number;
    size: number;
}

export const Snowfall = () => {
    const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

    useEffect(() => {
        // Generate snowflakes
        const flakes: Snowflake[] = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            animationDuration: Math.random() * 3 + 5, // 5-8 seconds
            opacity: Math.random() * 0.6 + 0.4, // 0.4-1
            size: Math.random() * 4 + 2, // 2-6px
        }));
        setSnowflakes(flakes);
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
            {snowflakes.map((flake) => (
                <div
                    key={flake.id}
                    className="absolute animate-snowfall"
                    style={{
                        left: `${flake.left}%`,
                        animationDuration: `${flake.animationDuration}s`,
                        animationDelay: `${Math.random() * 5}s`,
                        opacity: flake.opacity,
                        width: `${flake.size}px`,
                        height: `${flake.size}px`,
                    }}
                >
                    <div className="h-full w-full rounded-full bg-white shadow-sm" />
                </div>
            ))}
        </div>
    );
};

