# Cryptonite — Crypto Dashboard

A single-page application for browsing the top 100 cryptocurrencies, viewing real-time price charts, and getting AI-powered buy/sell recommendations.

## Tech Stack

- **React 19** + **TypeScript**
- **Redux Toolkit** for global state & API caching
- **React Router** for SPA navigation
- **Recharts** for real-time price charts
- **CoinGecko API** for coin data
- **CryptoCompare API** for real-time prices
- **OpenAI API** for AI recommendations
- **Pure CSS** (no Bootstrap/Tailwind)

## Features

- 🏠 **Home** — Browse 100 coins with search, More Info (USD/EUR/ILS prices), and selection toggle
- 📊 **Reports** — Real-time line chart polling every second via CryptoCompare
- 🤖 **AI Recommendation** — OpenAI-powered buy/sell analysis
- ℹ️ **About** — Project info & developer profile
- Max 5 coin selection with swap dialog
- Persistent selection across browser restarts (localStorage)

## Setup

```bash
npm install
cp .env.example .env   # Add your VITE_OPENAI_API_KEY
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_OPENAI_API_KEY` | Your OpenAI API key |

## Links

- **GitHub**: https://github.com/segev2002/Project_2
- **Deployed**: _(add deployed URL here)_

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
