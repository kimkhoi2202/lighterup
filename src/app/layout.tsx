import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { StoreProvider } from "@/components/providers/store-provider";
import "@/styles/globals.css";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "Lighter Up — Christmas Lights Installation Platform",
    description: "Professional Christmas lights installation services connecting homeowners with skilled contractors.",
};

export const viewport: Viewport = {
    themeColor: "#EA2831",
    colorScheme: "light",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="light" suppressHydrationWarning>
            <body className={inter.variable} suppressHydrationWarning>
                <StoreProvider>
                    <QueryProvider>
                        {children}
                        <Toaster />
                    </QueryProvider>
                </StoreProvider>
            </body>
        </html>
    );
}
