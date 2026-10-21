import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import "@/styles/globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://leaderstutors.com"),
  title: {
    default: "Leaders Tutors | Learn without limits",
    template: "%s | Leaders Tutors",
  },
  description:
    "Flexible online lessons, trusted tutors, and curriculum-based learning for students across Nigeria.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3e4095",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
