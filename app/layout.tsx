import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Brainwave 2",
    description: "Brainwave 2",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html className="text-[1rem]" lang="en">
            <body
                className={`${inter.variable} font-inter text-[#121212] tracking-[-0.02em] antialiased`}
            >
                {children}
            </body>
        </html>
    );
}
