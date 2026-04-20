// mock-data.ts — Datos de prueba para desarrollo
//
// Mientras el backend no está implementado, usamos estos datos para poder
// desarrollar y testear el frontend sin depender de ninguna API real.
//
// Estructura: representa la respuesta que devolverá el backend FastAPI.
// Cuando el backend esté listo, esto se borrará y se usará lib/api.ts.
//
// NOTA: Los precios son ficticios pero realistas basados en precios
// reales observados en Madrid (2024).

import type { Restaurant, ComparisonResult } from '@shared/types'

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'mcdonalds-gran-via-madrid',
    name: "McDonald's Gran Vía",
    address: 'Gran Vía, 55',
    city: 'Madrid',
    platforms: ['uber_eats', 'glovo', 'just_eat'],
    image_url: null,
  },
  {
    id: 'mcdonalds-sol-madrid',
    name: "McDonald's Sol",
    address: 'Puerta del Sol, 2',
    city: 'Madrid',
    platforms: ['uber_eats', 'glovo'],
    image_url: null,
  },
  {
    id: 'kfc-callao-madrid',
    name: 'KFC Callao',
    address: 'Pl. del Callao, 3',
    city: 'Madrid',
    platforms: ['uber_eats', 'just_eat'],
    image_url: null,
  },
  {
    id: 'burger-king-castellana',
    name: 'Burger King Castellana',
    address: 'Paseo de la Castellana, 14',
    city: 'Madrid',
    platforms: ['glovo', 'just_eat'],
    image_url: null,
  },
]

// Resultados de comparación para McDonald's Gran Vía
export const MOCK_COMPARISON: ComparisonResult = {
  restaurant: MOCK_RESTAURANTS[0],
  comparison: [
    {
      platform: 'uber_eats',
      product_price: 8.99,
      delivery_fee: 2.49,
      service_fee: 0.99,  // "tarifa de pequeño pedido" que cobran a veces
      total: 12.47,
      available: true,
      redirect_url: 'https://www.ubereats.com',
    },
    {
      platform: 'glovo',
      product_price: 9.50,  // Glovo suele inflar el precio del producto
      delivery_fee: 1.99,
      service_fee: 0.50,
      total: 11.99,
      available: true,
      redirect_url: 'https://glovoapp.com',
    },
    {
      platform: 'just_eat',
      product_price: 8.99,
      delivery_fee: 0.99,  // Just Eat suele tener el envío más barato
      service_fee: 0.50,
      total: 10.48,
      available: true,
      redirect_url: 'https://www.just-eat.es',
    },
  ],
  // La plataforma ganadora la calculamos en el frontend también
  // para poder mostrar el badge correcto
  winner: 'just_eat',
  savings: 1.99, // diferencia entre la más cara y la más barata
}
