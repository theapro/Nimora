import type { Metadata } from "next";
import { Geist, Geist_Mono, Judson, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const judson = Judson({
  variable: "--font-judson",
  subsets: ["latin"],
  weight: ["700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Nimora",
  description: "A modern blogging platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${judson.variable} ${poppins.variable} antialiased`}
        style={{ fontFamily: "var(--font-poppins)" }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
