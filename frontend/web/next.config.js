/** @type {import('next').NextConfig} */

// Configuración básica de Next.js para HungryDeal
// Por ahora no necesitamos nada muy especial, pero dejo aquí
// los hooks para cuando añadamos imágenes de las plataformas (Uber Eats, etc.)

const nextConfig = {
  images: {
    // Dominios de los que cargaremos imágenes de restaurantes
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudfront.net', // imágenes de Just Eat
      },
      {
        protocol: 'https',
        hostname: '**.uber.com', // imágenes de Uber Eats
      },
      {
        protocol: 'https',
        hostname: '**.glovoapp.com', // imágenes de Glovo
      },
    ],
  },
  // Habilitamos el output standalone para Docker en producción
  // output: 'standalone',  // descomentar cuando hagamos deploy
}

module.exports = nextConfig
