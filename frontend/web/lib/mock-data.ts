import type { Restaurant, ComparisonResult, Platform } from '@shared/types'

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'mcdonalds-gran-via-madrid',
    name: "McDonald's Gran Vía",
    address: 'Gran Vía, 55',
    city: 'Madrid',
    platforms: ['uber_eats', 'glovo', 'just_eat'],
    image_url: null,
    latitude: 40.4200,
    longitude: -3.7025,
  },
  {
    id: 'mcdonalds-sol-madrid',
    name: "McDonald's Sol",
    address: 'Puerta del Sol, 2',
    city: 'Madrid',
    platforms: ['uber_eats', 'glovo'],
    image_url: null,
    latitude: 40.4169,
    longitude: -3.7035,
  },
  {
    id: 'kfc-callao-madrid',
    name: 'KFC Callao',
    address: 'Pl. del Callao, 3',
    city: 'Madrid',
    platforms: ['uber_eats', 'just_eat'],
    image_url: null,
    latitude: 40.4208,
    longitude: -3.7071,
  },
  {
    id: 'burger-king-castellana',
    name: 'Burger King Castellana',
    address: 'Paseo de la Castellana, 14',
    city: 'Madrid',
    platforms: ['glovo', 'just_eat'],
    image_url: null,
    latitude: 40.4278,
    longitude: -3.6919,
  },
  {
    id: 'telepizza-arguelles',
    name: 'Telepizza Argüelles',
    address: 'Calle Princesa, 40',
    city: 'Madrid',
    platforms: ['uber_eats', 'glovo', 'just_eat'],
    image_url: null,
    latitude: 40.4266,
    longitude: -3.7133,
  },
  {
    id: 'vips-gran-via',
    name: 'VIPS Gran Vía',
    address: 'Gran Vía, 43',
    city: 'Madrid',
    platforms: ['uber_eats', 'just_eat'],
    image_url: null,
    latitude: 40.4198,
    longitude: -3.7040,
  },
  {
    id: 'istanbul-kebab-lavapies',
    name: 'Istanbul Kebab Lavapiés',
    address: 'Calle Lavapiés, 12',
    city: 'Madrid',
    platforms: ['glovo', 'just_eat'],
    image_url: null,
    latitude: 40.4095,
    longitude: -3.7018,
  },
  {
    id: 'wok-to-walk-callao',
    name: 'Wok to Walk Callao',
    address: 'Pl. del Callao, 1',
    city: 'Madrid',
    platforms: ['uber_eats', 'glovo'],
    image_url: null,
    latitude: 40.4210,
    longitude: -3.7065,
  },
]

export type Category = 'pizza' | 'hamburguesa' | 'turco' | 'asiatico'

export const MOCK_CATEGORIES: Record<string, Category> = {
  'mcdonalds-gran-via-madrid': 'hamburguesa',
  'mcdonalds-sol-madrid': 'hamburguesa',
  'kfc-callao-madrid': 'hamburguesa',
  'burger-king-castellana': 'hamburguesa',
  'telepizza-arguelles': 'pizza',
  'vips-gran-via': 'pizza',
  'istanbul-kebab-lavapies': 'turco',
  'wok-to-walk-callao': 'asiatico',
}

export interface RestaurantSummary {
  restaurant_id: string
  min_price: number
  winner_platform: Platform
  max_savings: number
}

export const MOCK_SUMMARIES: RestaurantSummary[] = [
  {
    restaurant_id: 'mcdonalds-gran-via-madrid',
    min_price: 10.48,
    winner_platform: 'just_eat',
    max_savings: 1.99,
  },
  {
    restaurant_id: 'mcdonalds-sol-madrid',
    min_price: 11.20,
    winner_platform: 'uber_eats',
    max_savings: 1.30,
  },
  {
    restaurant_id: 'kfc-callao-madrid',
    min_price: 9.99,
    winner_platform: 'just_eat',
    max_savings: 2.50,
  },
  {
    restaurant_id: 'burger-king-castellana',
    min_price: 10.75,
    winner_platform: 'glovo',
    max_savings: 1.75,
  },
  {
    restaurant_id: 'telepizza-arguelles',
    min_price: 12.49,
    winner_platform: 'just_eat',
    max_savings: 3.20,
  },
  {
    restaurant_id: 'vips-gran-via',
    min_price: 14.99,
    winner_platform: 'uber_eats',
    max_savings: 2.10,
  },
  {
    restaurant_id: 'istanbul-kebab-lavapies',
    min_price: 8.90,
    winner_platform: 'glovo',
    max_savings: 2.80,
  },
  {
    restaurant_id: 'wok-to-walk-callao',
    min_price: 11.50,
    winner_platform: 'uber_eats',
    max_savings: 1.60,
  },
]

export const MOCK_COMPARISON: ComparisonResult = {
  restaurant: MOCK_RESTAURANTS[0],
  comparison: [
    {
      platform: 'uber_eats',
      product_price: 8.99,
      delivery_fee: 2.49,
      service_fee: 0.99,
      total: 12.47,
      available: true,
      redirect_url: 'https://www.ubereats.com',
    },
    {
      platform: 'glovo',
      product_price: 9.50,
      delivery_fee: 1.99,
      service_fee: 0.50,
      total: 11.99,
      available: true,
      redirect_url: 'https://glovoapp.com',
    },
    {
      platform: 'just_eat',
      product_price: 8.99,
      delivery_fee: 0.99,
      service_fee: 0.50,
      total: 10.48,
      available: true,
      redirect_url: 'https://www.just-eat.es',
    },
  ],
  winner: 'just_eat',
  savings: 1.99,
}
