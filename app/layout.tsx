import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BackToTop from "@/app/components/BackToTop";

const inter = Inter({
    subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
    title: "AdminPanel",
    description: "",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className="min-h-full 2xl:px-0 flex flex-col bg-gray-50 h-full antialiased"
        >
            <body className={`${inter.className} min-h-full flex flex-col bg-gray-50`}>
            <BackToTop/>
                <main className="flex-auto mb-5">
                    <div className="mx-auto w-full h-full">
                        {children}
                    </div>
                </main>
            </body>
        </html>
    );
}
