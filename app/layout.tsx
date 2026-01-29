import type { Metadata } from "next";
import "./globals.css";

import TopNav from "./components/TopNav";

export const metadata: Metadata = {
  title: "Quandr3",
  description: "Ask. Share. Decide.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="antialiased"
        style={{
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
        }}
      >
        <TopNav />
        <main className="flex-1 w-full pt-4">{children}</main>
      </body>
    </html>
  );
}
