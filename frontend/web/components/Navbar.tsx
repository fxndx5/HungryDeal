'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { LoginModal } from '@/components/LoginModal'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [loginOpen, setLoginOpen] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const name = localStorage.getItem('user_name')
    const email = localStorage.getItem('user_email')
    setDisplayName(name || email)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

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
    setDropdownOpen(false)
    router.push('/')
    window.location.reload()
  }

  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : ''

  return (
    <>
      <nav className="sticky top-0 z-[1100] bg-white border-b border-slate-200 shadow-sm">
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
            {/* Buscar movil */}
            <Link
              href="/search"
              className="md:hidden p-2 text-slate-500 hover:text-brand-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {displayName ? (
              /* ── Avatar + dropdown ── */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1
                             hover:bg-slate-100 transition-colors group"
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center
                                  text-white text-sm font-bold flex-shrink-0 ring-2 ring-brand-200
                                  group-hover:ring-brand-400 transition-all">
                    {initials}
                  </div>
                  <span className="text-sm text-slate-600 hidden lg:block max-w-[110px] truncate">
                    {displayName}
                  </span>
                  {/* Chevron */}
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl
                                  border border-slate-100 overflow-hidden z-50
                                  animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header del dropdown */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {localStorage.getItem('user_email') || ''}
                      </p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <DropdownLink
                        href="/perfil"
                        onClick={() => setDropdownOpen(false)}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        }
                      >
                        Mi perfil
                      </DropdownLink>

                      <DropdownLink
                        href="/perfil?tab=historial"
                        onClick={() => setDropdownOpen(false)}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                      >
                        Historial
                      </DropdownLink>

                      <DropdownLink
                        href="/perfil?tab=config"
                        onClick={() => setDropdownOpen(false)}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        }
                      >
                        Configuracion
                      </DropdownLink>
                    </div>

                    {/* Separador + Cerrar sesion */}
                    <div className="border-t border-slate-100 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                                   text-red-500 hover:bg-red-50 transition-colors text-left"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Cerrar sesion
                      </button>
                    </div>
                  </div>
                )}
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
            <CategoryLink href="/ofertas" current={pathname}>Ofertas</CategoryLink>
            <CategoryLink href="/cerca" current={pathname}>Cerca de ti</CategoryLink>
          </div>
        </div>
      </nav>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}

/* ── Helpers ── */

function DropdownLink({
  href,
  icon,
  onClick,
  children,
}: {
  href: string
  icon: React.ReactNode
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700
                 hover:bg-slate-50 hover:text-brand-600 transition-colors"
    >
      <span className="text-slate-400 group-hover:text-brand-500">{icon}</span>
      {children}
    </Link>
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
