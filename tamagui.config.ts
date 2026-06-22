import { createTamagui } from 'tamagui'

const config = createTamagui({
  fonts: {
    heading: {
      family: 'System',
      size: { 1: 20, 2: 28, 3: 36, 4: 48 },
      lineHeight: { 1: 26, 2: 34, 3: 42, 4: 54 },
      weight: { 1: '600', 2: '700', 3: '800' },
    },
    body: {
      family: 'System',
      size: { 1: 14, 2: 16, 3: 18 },
      lineHeight: { 1: 20, 2: 22, 3: 26 },
      weight: { 1: '400', 2: '500' },
    },
  },
  tokens: {
    size: { 0: 0, 1: 4, 2: 8, true: 4, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40, 9: 48, 10: 64 },
    space: { 0: 0, 1: 4, 2: 8, true: 4, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40, 9: 48, 10: 64 },
    radius: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20 },
    zIndex: { 0: 0, 1: 100, 2: 200, 3: 300, 4: 400, 5: 500 },
    color: {
      primary: '#3b82f6',
      white: '#FFFFFF',
      black: '#000000',
    },
  },
  themes: {
    light: {
      primary: '#3b82f6',
      background: '#F5F5F5',
      color: '#1A1A1A',
    },
  },
})

export default config
