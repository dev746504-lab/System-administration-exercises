import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "vietnamese"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nền tảng LMS",
  description: "Quản lý học tập cho giáo viên và học sinh",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
