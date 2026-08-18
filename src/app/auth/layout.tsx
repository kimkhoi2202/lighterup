import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lighter Up - Authentication",
  description: "Sign in or create a Lighter Up account",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {children}
    </div>
  );
}
