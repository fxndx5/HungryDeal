import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: {
    default: 'HungryDeal - Compara precios de delivery',
    template: '%s | HungryDeal',
  },
  description:
    'Compara el precio total real entre Uber Eats, Glovo y Just Eat. ' +
    'Incluye envio y tasas. Elige siempre la opcion mas barata.',
  keywords: ['delivery', 'uber eats', 'glovo', 'just eat', 'comparar precios', 'comida a domicilio'],
  openGraph: {
    title: 'HungryDeal - Compara precios de delivery',
    description: 'Nunca mas pagues de mas por el mismo pedido.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />

        <main className="flex-1">
          {children}
        </main>

        <footer className="py-6 text-center text-sm text-slate-400 border-t border-slate-100">
          <p>2026 HungryDeal - Compara antes de pedir</p>
        </footer>
      </body>
    </html>
  )
}
