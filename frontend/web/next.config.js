/** @type {import('next').NextConfig} */

// Configuración básica de Next.js para HungryDeal
// Por ahora no necesitamos nada muy especial, pero dejo aquí
// los hooks para cuando añadamos imágenes de las plataformas (Uber Eats, etc.)

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: '**.uber.com',
      },
      {
        protocol: 'https',
        hostname: '**.glovoapp.com',
      },
    ],
  },
  // Habilitamos el output standalone para Docker en producción
  // output: 'standalone',  // descomentar cuando hagamos deploy
}

module.exports = nextConfig
