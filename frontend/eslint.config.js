import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // Komponen primitif vendor (shadcn/ui & Magic UI) di-generate dan diperbarui
  // lewat CLI: sengaja mengekspor varian/hook (cva, useFormField, useSidebar)
  // dan memakai pola efek/animasi tertentu. Aturan berikut bersifat dev-only
  // (Fast Refresh) atau pola vendor, sehingga dimatikan khusus folder ini agar
  // tidak mengganggu pembaruan vendor — kode aplikasi tetap diawasi penuh.
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
    },
  },
])
