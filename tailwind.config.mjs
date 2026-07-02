/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md}'],
    theme: {
        extend: {
            colors: {
                base: '#F8F7F4',
                card: '#FFFFFF',
                subtle: '#F8F7F4', // using same as base or slightly different if needed
                border: '#E8E8E6',
                primary: '#222222',
                secondary: '#666666',
                muted: '#666666', // same as secondary for muted
                accent: '#2F5D50',
                'accent-hover': '#66785F',
                'accent-light': '#F8F7F4', 
                protein: '#2F5D50',
                carbs: '#B05D4F',
                fat: '#B38A3A',
                success: '#6F8A67',
                warning: '#B38A3A',
                danger: '#B05D4F',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            borderRadius: {
                card: '20px',
                input: '12px',
                btn: '12px',
            },
            boxShadow: {
                sm: '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
                md: '0 4px 12px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.03)',
            }
        },
    },
}