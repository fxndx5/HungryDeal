# Código Compartido - HungryDeal

Código reutilizable entre la aplicación **web** (Next.js) y la aplicación **móvil** (Expo).

## Estructura

```
shared/
├── api/          # Clientes HTTP compartidos
│   └── client.ts # Instancia base de fetch/axios con la URL del backend
└── types/        # Tipos TypeScript compartidos
    ├── price.ts  # Interfaces de precios y comparaciones
    └── user.ts   # Interfaces de usuario y autenticación
```

## Ejemplo de tipo compartido

```typescript
// types/price.ts
export type Platform = "ubereats" | "glovo" | "justeat";

export interface PriceBreakdown {
  platform: Platform;
  productPrice: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
}

export interface ComparisonResult {
  query: string;
  restaurant: string;
  prices: PriceBreakdown[];
  cheapest: Platform;
}
```

## Ejemplo de cliente API

```typescript
// api/client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```
