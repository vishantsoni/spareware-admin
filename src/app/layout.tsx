import { Metadata } from 'next';
import React from 'react'
import { Outfit } from 'next/font/google'
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';
// import "flatpickr/dist/flatpickr.css";

const outfit = Outfit({
    subsets: ["latin"],
});


export const metadata: Metadata = {
    title:
        "Spareware Private Limited",
    description: "Spareware Private Limited Description",
};


export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {

    return (
        <html lang='en' suppressHydrationWarning>
            <body className={`${outfit.className} dark:bg-gray-900`}>
                <ThemeProvider>
                    <AuthProvider>
                        <SidebarProvider>
                            {children}
                        </SidebarProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
