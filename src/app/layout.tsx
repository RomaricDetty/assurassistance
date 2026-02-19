import ThemeProvider from "@/components/layout/theme/theme-provider";
import {fontVariables} from "@/lib/font";
import {cn} from "@/lib/utils";
import type {Metadata} from "next";
import NextTopLoader from "nextjs-toploader";
import {Toaster} from "sonner";

import AuthProvider from "@/providers/auth-provider";
import QueryProvider from "@/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
    title: "Dashboard marchand - MonPote",
    description: "Dashboard marchand - MonPote",
};

export default function RootLayout({children,}: Readonly<{ children: React.ReactNode; }>) {
    return (
        <AuthProvider>
            <html lang="en" suppressHydrationWarning>
            <head></head>
            <body
                className={cn(
                    "bg-background overflow-hidden overscroll-none font-sans antialiased",
                    // activeThemeValue ? `theme-${activeThemeValue}` : "",
                    // isScaled ? "theme-scaled" : "",
                    fontVariables
                )}
            >
            <NextTopLoader showSpinner={false}/>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
                enableColorScheme
            >
                <QueryProvider>
                    <Toaster/>
                    {children}
                </QueryProvider>
            </ThemeProvider>
            </body>
            </html>
        </AuthProvider>
    );
}
