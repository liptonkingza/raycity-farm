import type { Metadata } from 'next'
import { Prompt } from 'next/font/google'
import './globals.css'

const prompt = Prompt({
    subsets: ['latin', 'thai'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-prompt',
})

export const metadata: Metadata = {
    title: "[RC Garage Log]",
    description: "Cyberpunk style timer and log for RC Garage",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="th">
            <body className={prompt.className}>{children}</body>
        </html>
    )
}
