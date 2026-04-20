# Frontend Web - HungryDeal

Aplicacion web construida con **Next.js 14** (App Router), **TypeScript** y **Tailwind CSS**.

Comparador de precios de delivery que permite buscar restaurantes y ver el precio total real
en Uber Eats, Glovo y Just Eat, incluyendo envio y tasas de servicio.

## Paleta de colores

| Uso             | Color   | Hex       |
|-----------------|---------|-----------|
| Principal       | Teal    | `#2D6F6F` |
| Acento          | Gold    | `#D4A843` |
| Fondo           | Slate   | `#f8fafc` |
| Texto principal | Dark    | `#1e293b` |

## Estructura del proyecto

```
web/
  app/
    layout.tsx              # Layout raiz con Navbar y footer
    page.tsx                # Pagina principal (hero + buscador)
    globals.css             # Estilos globales y variables CSS
    search/
      page.tsx              # Resultados de busqueda
    compare/
      [id]/
        page.tsx            # Comparacion de precios por plataforma
  components/
    Navbar.tsx              # Barra de navegacion (estilo TripAdvisor)
    SearchBar.tsx           # Formulario de busqueda con icono
    RestaurantCard.tsx      # Tarjeta de restaurante en resultados
    PlatformPriceCard.tsx   # Tarjeta de precio desglosado por plataforma
    LoadingSkeleton.tsx     # Placeholders animados de carga
  lib/
    mock-data.ts            # Datos de ejemplo para desarrollo
  public/
    logo.png                # Logo de HungryDeal (HD con pin de ubicacion)
  tailwind.config.ts        # Configuracion de Tailwind con colores de marca
  next.config.js            # Configuracion de Next.js
  tsconfig.json             # Configuracion de TypeScript
```

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Arrancar el servidor de desarrollo
npm run dev
```

El servidor arranca en `http://localhost:3000`.

## Diseno UX/UI

La interfaz sigue un estilo inspirado en TripAdvisor:

- **Navbar** con dos filas: logo + buscador + acciones arriba, categorias de navegacion abajo
- **Hero** con fondo de marca (teal) y buscador principal integrado
- **Tarjetas** con bordes suaves, sombras sutiles y hover states
- **Tipografia** Inter para legibilidad

## Conexion con el backend

Actualmente usa datos mock en `lib/mock-data.ts`. Cuando el backend este listo,
las llamadas se haran a:

- `GET /api/v1/search?q=...` para buscar restaurantes
- `GET /api/v1/compare/{id}` para obtener la comparacion de precios

## Scripts disponibles

| Comando         | Descripcion                          |
|-----------------|--------------------------------------|
| `npm run dev`   | Servidor de desarrollo con hot reload|
| `npm run build` | Build de produccion                  |
| `npm run start` | Arrancar build de produccion         |
| `npm run lint`  | Ejecutar ESLint                      |
