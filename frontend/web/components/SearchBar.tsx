'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  initialValue?: string
  size?: 'lg' | 'md'
}

export function SearchBar({ initialValue = '', size = 'lg' }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const router = useRouter()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const isLarge = size === 'lg'

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 w-full"
      role="search"
      aria-label="Buscar restaurante"
    >
      <div className="flex-1 relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ciudad o nombre de restaurante"
          className={`w-full border border-slate-200 bg-white rounded-xl
                      text-slate-800 placeholder-slate-400 outline-none
                      focus:border-brand-400 focus:ring-2 focus:ring-brand-100
                      transition-all duration-150 pl-11
                      ${isLarge ? 'pr-5 py-4 text-lg' : 'pr-4 py-3 text-base'}`}
        />
      </div>

      <button
        type="submit"
        className={`bg-brand-500 hover:bg-brand-600 active:bg-brand-700
                    text-white font-semibold rounded-xl
                    transition-colors duration-150 whitespace-nowrap
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isLarge ? 'px-7 py-4 text-lg' : 'px-5 py-3 text-base'}`}
        disabled={!query.trim()}
      >
        Comparar
      </button>
    </form>
  )
}
