# Frontend Móvil - HungryDeal

Aplicación móvil construida con **React Native** y **Expo** en **TypeScript**.

## Estructura esperada

```
mobile/
├── app/                     # Expo Router (file-based routing)
│   ├── _layout.tsx          # Layout principal con navegación
│   ├── index.tsx            # Pantalla de inicio (buscador)
│   ├── search.tsx           # Resultados de búsqueda
│   └── (auth)/
│       ├── login.tsx
│       └── register.tsx
├── components/
│   ├── SearchBar.tsx
│   ├── PriceCard.tsx
│   └── PlatformBadge.tsx
├── hooks/
│   └── useApi.ts            # Hook para llamadas al backend
├── app.json
├── package.json
└── tsconfig.json
```

## Inicialización

```bash
npx create-expo-app . --template tabs
npx expo start
```

## Ejemplo de componente esperado

```tsx
// components/PriceCard.tsx
import { View, Text, StyleSheet } from "react-native";

interface PriceCardProps {
  platform: "ubereats" | "glovo" | "justeat";
  total: number;
}

export function PriceCard({ platform, total }: PriceCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.platform}>{platform}</Text>
      <Text style={styles.price}>{total.toFixed(2)} €</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 16, backgroundColor: "#fff", elevation: 2 },
  platform: { fontSize: 14, fontWeight: "600", textTransform: "capitalize" },
  price: { fontSize: 24, fontWeight: "bold", marginTop: 4 },
});
```
