/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                },
                'ocean-dark': '#0f172a', // Slate 900
                'ocean-depth': '#1e293b', // Slate 800
                'ocean-teal': '#14b8a6', // Teal 500
                'ocean-blue': '#0ea5e9', // Sky 500
                'ocean-light': '#e2e8f0', // Slate 200
            },
            boxShadow: {
                'soft-teal': '0 4px 20px -2px rgba(20, 184, 166, 0.2)',
                'soft-blue': '0 4px 20px -2px rgba(14, 165, 233, 0.2)',
            },
            fontFamily: {
                sans: ['var(--font-prompt)'],
            },
        },
    },
    plugins: [],
}
