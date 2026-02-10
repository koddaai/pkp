import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PKP Studio",
  description: "Manage your PKP product catalogs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
