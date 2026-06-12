import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cup Circle 26",
  description: "A tiny World Cup picks board for friends.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
