import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    'system-ui',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    '"Segoe UI"',
                    'Roboto',
                    'sans-serif',
                ],
            },
            colors: {
                background: {
                    DEFAULT: '#FAFAFA', // Subtle gray background
                    paper: '#FFFFFF',   // White cards/sidebar
                },
                border: {
                    DEFAULT: '#EAEAEA',
                },
                text: {
                    primary: '#000000',
                    secondary: '#666666',
                    tertiary: '#999999',
                },
                // Minimalist Categories (Grayscale/Muted)
                category: {
                    fitness: '#E5E7EB', // Gray-200
                    learning: '#E5E7EB',
                    reading: '#E5E7EB',
                    work: '#E5E7EB',
                    hobbies: '#E5E7EB',
                    health: '#E5E7EB',
                    social: '#E5E7EB',
                    other: '#E5E7EB',
                }
            },
            boxShadow: {
                'subtle': '0 1px 2px rgba(0, 0, 0, 0.02)',
                'elevated': '-2px 0 8px rgba(0, 0, 0, 0.1)', // For settings panel
            }
        },
    },
    plugins: [
        animate,
    ],
}
