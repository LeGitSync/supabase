import { pixelBasedPreset } from '@react-email/components'

/**
 * Shared Tailwind config for transactional emails.
 * Use with <Tailwind config={emailTailwindConfig}> in each email template.
 *
 * Colour tokens align with the Supabase design system (light theme):
 * - destructive: DEFAULT #E54D2E, 600 #CA3214, 700 #B32912
 * - foreground: DEFAULT #171717, light #525252, lighter #707070, muted #A0A0A0
 * - border: default #E6E6E6, muted #E0E0E0, overlay #E8E8E8
 */
export const emailTailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        brand: '#007291',
        destructive: {
          DEFAULT: '#E54D2E',
          600: '#CA3214',
          700: '#B32912',
        },
        foreground: {
          DEFAULT: '#171717',
          light: '#525252',
          lighter: '#707070',
          muted: '#A0A0A0',
        },
        // Border tokens: border-default, border-muted, border-overlay
        default: '#E6E6E6',
        muted: '#E0E0E0',
        overlay: '#E8E8E8',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Ubuntu',
          'sans-serif',
        ],
      },
    },
  },
}
