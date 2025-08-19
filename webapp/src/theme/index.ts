'use client'

import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
}

const theme = extendTheme({
  config,
  styles: {
    global: {
      body: {
        bg: 'var(--background)',
        color: 'var(--foreground)',
      },
    },
  },
})

export default theme
