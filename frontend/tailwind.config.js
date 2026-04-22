/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0a0a0b',
                surface: '#121214',
                surfaceHover: '#1c1c1f',
                primary: '#3b82f6',
                primaryHover: '#2563eb',
                textMain: '#f3f4f6',
                textMuted: '#9ca3af',
                borderContent: '#27272a',
                danger: '#ef4444'
            }
        },
    },
    plugins: [],
}
