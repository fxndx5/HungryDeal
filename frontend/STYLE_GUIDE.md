# Guía de Estilos — HungryDeal

## Paleta de colores (extraída del logo)

| Uso | Color | Hex |
|-----|-------|-----|
| **Principal** | Verde azulado | `#2E7A7A` |
| **Acento** | Dorado | `#C4973A` |
| **Cabeceras de sección** | Verde oscuro | `#1F5555` |

## Tokens para Tailwind CSS (web)

```js
// tailwind.config.ts → theme.extend.colors
colors: {
  primary: {
    DEFAULT: '#2E7A7A',
    dark: '#1F5555',
  },
  accent: '#C4973A',
}
```

## Uso en componentes

```tsx
// Ejemplo de uso en Tailwind
<header className="bg-primary-dark text-white">...</header>
<button className="bg-primary hover:bg-primary-dark">Comparar</button>
<span className="text-accent font-bold">Más barato</span>
```

## Tokens para React Native (mobile)

```ts
// shared/theme/colors.ts
export const colors = {
  primary: '#2E7A7A',
  primaryDark: '#1F5555',
  accent: '#C4973A',
} as const;
```
