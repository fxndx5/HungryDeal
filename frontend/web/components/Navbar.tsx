'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoginModal } from '@/components/LoginModal'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [loginOpen, setLoginOpen] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    const name = localStorage.getItem('user_name')
    const email = localStorage.getItem('user_email')
    setDisplayName(name || email)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    setSearchQuery('')
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_name')
    setDisplayName(null)
    window.location.reload()
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <Image src="/logo.png" alt="HungryDeal" width={36} height={36} />
            <span className="font-extrabold text-xl text-brand-800 hidden sm:inline">
              Hungry<span className="text-brand-500">Deal</span>
            </span>
          </Link>

          {/* Buscador */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-md hidden md:flex items-center bg-slate-100
                       rounded-full border border-slate-200 hover:border-brand-300
                       focus-within:border-brand-400 focus-within:ring-2
                       focus-within:ring-brand-100 transition-all"
          >
            <svg className="w-4 h-4 ml-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar restaurante..."
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-700
                         placeholder-slate-400 outline-none"
            />
          </form>

          {/* Acciones */}
          <div className="flex items-center gap-3 ml-auto flex-shrink-0">
            <Link
              href="/search"
              className="md:hidden p-2 text-slate-500 hover:text-brand-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {displayName ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center
                                text-white text-sm font-bold flex-shrink-0">
                  {displayName[0].toUpperCase()}
                </div>
                <span className="text-sm text-slate-600 hidden lg:block max-w-[120px] truncate">
                  {displayName}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-400 hover:text-red-500
                             transition-colors px-2 py-1"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="bg-brand-700 hover:bg-brand-800 text-white text-sm
                           font-semibold px-5 py-2 rounded-full transition-colors"
              >
                Entrar
              </button>
            )}
          </div>
        </div>

        {/* Nav links */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-1 -mb-px overflow-x-auto scrollbar-hide">
            <CategoryLink href="/" current={pathname}>Inicio</CategoryLink>
            <CategoryLink href="/search" current={pathname}>Restaurantes</CategoryLink>
            <CategoryLink href="/search?q=ofertas" current={pathname}>Ofertas</CategoryLink>
            <CategoryLink href="/search?q=cerca" current={pathname}>Cerca de ti</CategoryLink>
          </div>
        </div>
      </nav>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}

function CategoryLink({
  href,
  current,
  children,
}: {
  href: string
  current: string
  children: React.ReactNode
}) {
  const isActive = current === href || (href !== '/' && current.startsWith(href.split('?')[0]))

  return (
    <Link
      href={href}
      className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
        ${isActive
          ? 'border-brand-500 text-brand-600'
          : 'border-transparent text-slate-500 hover:text-brand-500 hover:border-brand-300'
        }`}
    >
      {children}
    </Link>
  )
}
