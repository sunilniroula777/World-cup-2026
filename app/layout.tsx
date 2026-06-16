import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pool XI",
  description: "A private World Cup pool for friends.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
