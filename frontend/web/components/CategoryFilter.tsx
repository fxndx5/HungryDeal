'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const CATEGORIES = [
  {
    id: 'pizza',
    label: 'Pizza',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.93V16c0-.55.45-1 1-1s1 .45 1 1v1.93c-3.06-.45-5.48-2.87-5.93-5.93H9c.55 0 1 .45 1 1s-.45 1-1 1H7.07C7.52 16.06 9.94 18.48 11 17.93zM12 4c4.41 0 8 3.59 8 8 0 .34-.02.67-.06 1H18c-.55 0-1-.45-1-1s.45-1 1-1h1.71C19.16 7.56 15.85 4.56 12 4.07V6c0 .55-.45 1-1 1s-1-.45-1-1V4.07C6.15 4.56 2.84 7.56 2.29 11H4c.55 0 1 .45 1 1s-.45 1-1 1H2.06C2.02 12.67 2 12.34 2 12c0-4.41 3.59-8 8-8z" />
      </svg>
    ),
  },
  {
    id: 'hamburguesa',
    label: 'Hamburguesa',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M20 9H4v2h16V9zM4 14v2h16v-2H4zm0-3v2h16v-2H4zM12 3C7.04 3 3 7.04 3 12h18c0-4.96-4.04-9-9-9zM3 18c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3v-1H3v1z" />
      </svg>
    ),
  },
  {
    id: 'turco',
    label: 'Turco',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M11 4h2v2h2v2h-2v1h2v2h-2v1h2v2h-2v1h2v3h-2v-3h-2v3H9v-3H7v-2h2v-1H7v-2h2v-1H7V9h2V7H7V5h2V4h2zm0 4v1h2V8h-2zm0 3v1h2v-1h-2zm0 3v1h2v-1h-2z" />
      </svg>
    ),
  },
  {
    id: 'asiatico',
    label: 'Asiatico',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M22 4l-4.5 4.5c.39 1.16.6 2.4.5 3.7C17.5 17.26 13.14 21 8 21c-2.74 0-5.21-1.11-7-2.9L4.5 15.6C5.92 17.07 7.85 18 10 18c3.87 0 7-3.13 7-7 0-.44-.04-.87-.12-1.29L22 4zM2 4l7 7c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3c-.17 0-.34.02-.5.05L8.9 5.45C9.25 5.17 9.62 4.93 10 4.71V3C5.72 3 2.32 6.1 2 10h1.07C3.41 6.76 6.13 4.16 9.5 4H10V3C7.24 3 4.77 4.04 2.93 5.77L2 4z" />
      </svg>
    ),
  },
]

interface CategoryFilterProps {
  active?: string
}

export function CategoryFilter({ active }: CategoryFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleClick(categoryId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get('cat') === categoryId) {
      params.delete('cat')
    } else {
      params.set('cat', categoryId)
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="flex gap-2 flex-wrap mb-6">
      {CATEGORIES.map((cat) => {
        const isActive = active === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => handleClick(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold
                        transition-all duration-150 select-none
                        ${isActive
                          ? 'bg-brand-500 text-white border-brand-500 shadow-md'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50'
                        }`}
          >
            <span className={isActive ? 'text-white' : 'text-slate-500'}>
              {cat.icon}
            </span>
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
