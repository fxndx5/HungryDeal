'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Tab = 'actividad' | 'historial' | 'config'

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  created_at: string
}

interface HistoryItem {
  id: string
  query: string | null
  restaurant_id: string | null
  restaurant_name: string | null
  platform_chosen: string | null
  savings: number | null
  searched_at: string
}

interface UserStats {
  total_comparisons: number
  total_savings: number
  unique_restaurants: number
}

const PLATFORM_LABELS: Record<string, { label: string; color: string }> = {
  uber_eats: { label: 'Uber Eats', color: 'bg-green-100 text-green-700' },
  glovo:     { label: 'Glovo',     color: 'bg-yellow-100 text-yellow-700' },
  just_eat:  { label: 'Just Eat',  color: 'bg-orange-100 text-orange-700' },
}

export default function PerfilPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as Tab | null
  const [activeTab, setActiveTab] = useState<Tab>(tabParam ?? 'actividad')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Historial real
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [stats, setStats] = useState<UserStats>({ total_comparisons: 0, total_savings: 0, unique_restaurants: 0 })
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyTotal, setHistoryTotal] = useState(0)

  // Config
  const [saveName, setSaveName] = useState({ first: '', last: '' })
  const [saveMsg, setSaveMsg] = useState('')

  // Sync tab con URL param
  useEffect(() => {
    if (tabParam && ['actividad', 'historial', 'config'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Cargar perfil + historial al montar
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    // Perfil
    fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setProfile(data)
          setSaveName({ first: data.first_name ?? '', last: data.last_name ?? '' })
        } else {
          setProfile({
            id: '',
            email: localStorage.getItem('user_email') ?? '',
            first_name: localStorage.getItem('user_name') ?? null,
            last_name: null,
            created_at: new Date().toISOString(),
          })
        }
      })
      .catch(() => {
        setProfile({
          id: '',
          email: localStorage.getItem('user_email') ?? '',
          first_name: localStorage.getItem('user_name') ?? null,
          last_name: null,
          created_at: new Date().toISOString(),
        })
      })
      .finally(() => setLoading(false))

    // Historial + stats
    setHistoryLoading(true)
    fetch(`${apiUrl}/api/v1/users/me/history?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setHistory(data.items ?? [])
          setStats(data.stats ?? { total_comparisons: 0, total_savings: 0, unique_restaurants: 0 })
          setHistoryTotal(data.total ?? 0)
        }
      })
      .catch(() => { /* historial no disponible, ok */ })
      .finally(() => setHistoryLoading(false))
  }, [router])

  function getDisplayName(p: UserProfile) {
    const parts = [p.first_name, p.last_name].filter(Boolean)
    return parts.length ? parts.join(' ') : p.email.split('@')[0]
  }

  function getInitials(p: UserProfile) {
    const name = getDisplayName(p)
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    } catch { return '' }
  }

  function formatDateTime(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    } catch { return iso }
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    const params = new URLSearchParams()
    if (tab !== 'actividad') params.set('tab', tab)
    router.replace(`/perfil${params.toString() ? '?' + params.toString() : ''}`, { scroll: false })
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault()
    setSaveMsg('')
    const token = localStorage.getItem('token')
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    try {
      const res = await fetch(`${apiUrl}/api/v1/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: saveName.first || null,
          last_name: saveName.last || null,
        }),
      })

      if (!res.ok) throw new Error('Error al guardar')

      const updated = await res.json()

      // Actualizar estado local y localStorage
      setProfile(prev => prev ? { ...prev, first_name: updated.first_name, last_name: updated.last_name } : prev)
      if (updated.first_name) localStorage.setItem('user_name', updated.first_name)

      setSaveMsg('Perfil actualizado correctamente')
    } catch {
      setSaveMsg('No se pudo guardar. Comprueba tu conexion.')
    }
    setTimeout(() => setSaveMsg(''), 3500)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  const displayName = getDisplayName(profile)
  const initials = getInitials(profile)

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Banner ── */}
      <div
        className="h-44 w-full relative"
        style={{ background: 'linear-gradient(135deg, #1d4949 0%, #2D6F6F 60%, #4d9090 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute bottom-4 right-6 text-white/40 text-xs">
          Miembro desde {formatDate(profile.created_at)}
        </div>
      </div>

      {/* ── Card principal ── */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-card -mt-6 relative z-10 mb-6">

          {/* Avatar + nombre */}
          <div className="px-8 pt-6 pb-5 flex flex-col sm:flex-row items-start sm:items-end gap-5">
            <div className="w-24 h-24 rounded-full bg-brand-500 flex items-center justify-center
                            text-white text-3xl font-bold ring-4 ring-white shadow-md flex-shrink-0 -mt-14">
              {initials}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-800">{displayName}</h1>
              <p className="text-slate-400 text-sm mt-0.5">{profile.email}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Se unio en {formatDate(profile.created_at)}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleTabChange('config')}
              className="flex items-center gap-2 border border-slate-200 hover:border-brand-300
                         text-sm text-slate-600 hover:text-brand-600 px-4 py-2 rounded-xl
                         transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar perfil
            </button>
          </div>

          {/* ── Stats reales ── */}
          <div className="grid grid-cols-3 border-t border-slate-100">
            <StatBox
              value={stats.total_comparisons}
              label="Comparaciones"
              icon={
                <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
            <StatBox
              value={`${stats.total_savings.toFixed(2)} €`}
              label="Ahorro acumulado"
              icon={
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatBox
              value={stats.unique_restaurants}
              label="Restaurantes"
              icon={
                <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* ── Layout 2 columnas ── */}
        <div className="flex flex-col lg:flex-row gap-6 pb-12">

          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0 space-y-4">
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="font-semibold text-slate-700 text-sm mb-3">Datos de la cuenta</h3>
              <div className="space-y-2 text-sm text-slate-500">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="break-all">{profile.email}</span>
                </div>
                {profile.first_name && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{[profile.first_name, profile.last_name].filter(Boolean).join(' ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Logros */}
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="font-semibold text-slate-700 text-sm mb-1">Tus logros</h3>
              <p className="text-xs text-slate-400 mb-3">Empieza a comparar para desbloquearlos.</p>
              <div className="space-y-2">
                <LogroItem
                  locked={stats.total_comparisons < 1}
                  title="Primera comparacion"
                  desc="Compara precios por primera vez"
                />
                <LogroItem
                  locked={stats.total_savings < 10}
                  title="Ahorrador experto"
                  desc="Ahorra mas de 10 euros en total"
                />
                <LogroItem
                  locked={stats.unique_restaurants < 10}
                  title="Explorador"
                  desc="Compara 10 restaurantes distintos"
                />
              </div>
              <button
                onClick={() => handleTabChange('actividad')}
                className="mt-3 w-full text-center text-xs font-semibold text-brand-600
                           hover:text-brand-700 py-2 bg-brand-50 hover:bg-brand-100
                           rounded-lg transition-colors"
              >
                Ver todo
              </button>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-slate-100">
                <TabButton active={activeTab === 'actividad'} onClick={() => handleTabChange('actividad')}>
                  Actividad
                </TabButton>
                <TabButton active={activeTab === 'historial'} onClick={() => handleTabChange('historial')}>
                  Historial
                  {historyTotal > 0 && (
                    <span className="ml-2 bg-brand-100 text-brand-600 text-xs font-semibold
                                     px-1.5 py-0.5 rounded-full">{historyTotal}</span>
                  )}
                </TabButton>
                <TabButton active={activeTab === 'config'} onClick={() => handleTabChange('config')}>
                  Configuracion
                </TabButton>
              </div>

              <div className="p-6">

                {/* ── ACTIVIDAD ── */}
                {activeTab === 'actividad' && (
                  <div>
                    <h2 className="font-semibold text-slate-700 mb-4">Registro de actividad</h2>

                    {stats.total_comparisons > 0 ? (
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <ActivityCard
                          icon="🔍"
                          value={stats.total_comparisons}
                          label="comparaciones realizadas"
                          color="brand"
                        />
                        <ActivityCard
                          icon="💰"
                          value={`${stats.total_savings.toFixed(2)} €`}
                          label="ahorro total acumulado"
                          color="green"
                        />
                        <ActivityCard
                          icon="🍽️"
                          value={stats.unique_restaurants}
                          label="restaurantes distintos"
                          color="amber"
                        />
                      </div>
                    ) : (
                      <EmptyState
                        icon={
                          <svg className="w-14 h-14 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        }
                        title="Aun no hay actividad"
                        subtitle="Cuando hagas comparaciones de precios apareceran aqui."
                        cta="Buscar restaurantes"
                        ctaHref="/search"
                      />
                    )}

                    {/* Ultimas comparaciones en actividad */}
                    {history.length > 0 && (
                      <div>
                        <h3 className="font-medium text-slate-600 text-sm mb-3">Ultimas comparaciones</h3>
                        <div className="space-y-2">
                          {history.slice(0, 5).map(item => (
                            <HistoryRow key={item.id} item={item} formatDateTime={formatDateTime} />
                          ))}
                        </div>
                        {historyTotal > 5 && (
                          <button
                            onClick={() => handleTabChange('historial')}
                            className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
                          >
                            Ver todo el historial ({historyTotal} entradas)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── HISTORIAL ── */}
                {activeTab === 'historial' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-slate-700">Historial de comparaciones</h2>
                      {historyTotal > 0 && (
                        <span className="text-xs text-slate-400">{historyTotal} entradas</span>
                      )}
                    </div>

                    {historyLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-7 h-7 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                      </div>
                    ) : history.length > 0 ? (
                      <div className="space-y-2">
                        {history.map(item => (
                          <HistoryRow key={item.id} item={item} formatDateTime={formatDateTime} />
                        ))}
                        {historyTotal > history.length && (
                          <p className="text-center text-xs text-slate-400 pt-4">
                            Mostrando los 50 mas recientes de {historyTotal}
                          </p>
                        )}
                      </div>
                    ) : (
                      <EmptyState
                        icon={
                          <svg className="w-14 h-14 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                        title="Tu historial esta vacio"
                        subtitle="Cada vez que compares precios lo guardamos aqui para que puedas consultarlo."
                        cta="Comparar ahora"
                        ctaHref="/search"
                      />
                    )}
                  </div>
                )}

                {/* ── CONFIGURACION ── */}
                {activeTab === 'config' && (
                  <div>
                    <h2 className="font-semibold text-slate-700 mb-5">Configuracion de la cuenta</h2>
                    <form onSubmit={handleSaveConfig} className="space-y-5 max-w-md">

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                          <input
                            type="text"
                            value={saveName.first}
                            onChange={e => setSaveName(s => ({ ...s, first: e.target.value }))}
                            placeholder="Nombre"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                       text-slate-700 outline-none focus:border-brand-400
                                       focus:ring-2 focus:ring-brand-100 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
                          <input
                            type="text"
                            value={saveName.last}
                            onChange={e => setSaveName(s => ({ ...s, last: e.target.value }))}
                            placeholder="Apellido"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                                       text-slate-700 outline-none focus:border-brand-400
                                       focus:ring-2 focus:ring-brand-100 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Correo electronico
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full border border-slate-100 bg-slate-50 rounded-xl px-4 py-2.5
                                     text-sm text-slate-400 cursor-not-allowed"
                        />
                        <p className="text-xs text-slate-400 mt-1">El email no se puede cambiar por ahora.</p>
                      </div>

                      {saveMsg && (
                        <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 border
                          ${saveMsg.includes('correctamente')
                            ? 'text-green-600 bg-green-50 border-green-200'
                            : 'text-red-600 bg-red-50 border-red-200'}`}>
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {saveMsg.includes('correctamente')
                              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            }
                          </svg>
                          {saveMsg}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="bg-brand-600 hover:bg-brand-700 text-white font-semibold
                                   text-sm px-6 py-2.5 rounded-xl transition-colors"
                      >
                        Guardar cambios
                      </button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-500 mb-3">Zona de peligro</h3>
                      <p className="text-sm text-slate-400 mb-3">
                        Una vez que elimines tu cuenta no hay marcha atras. Todos tus datos seran borrados.
                      </p>
                      <button
                        type="button"
                        disabled
                        className="text-sm text-red-400 border border-red-200 hover:bg-red-50
                                   px-4 py-2 rounded-xl transition-colors disabled:opacity-50
                                   disabled:cursor-not-allowed"
                      >
                        Eliminar cuenta (proximamente)
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function HistoryRow({
  item,
  formatDateTime,
}: {
  item: HistoryItem
  formatDateTime: (iso: string) => string
}) {
  const platform = item.platform_chosen ? PLATFORM_LABELS[item.platform_chosen] : null

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
      {/* Icono */}
      <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">
          {item.restaurant_name ?? item.query ?? 'Restaurante'}
        </p>
        <p className="text-xs text-slate-400">{formatDateTime(item.searched_at)}</p>
      </div>

      {/* Badge plataforma */}
      {platform && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${platform.color}`}>
          {platform.label}
        </span>
      )}

      {/* Ahorro */}
      {item.savings !== null && item.savings > 0 && (
        <span className="text-xs font-semibold text-green-600 flex-shrink-0">
          -{item.savings.toFixed(2)} €
        </span>
      )}

      {/* Link a compare */}
      {item.restaurant_id && (
        <Link
          href={`/compare/${item.restaurant_id}`}
          className="text-xs text-slate-300 group-hover:text-brand-500 transition-colors flex-shrink-0"
          title="Ver comparacion"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  )
}

function ActivityCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string
  value: string | number
  label: string
  color: 'brand' | 'green' | 'amber'
}) {
  const bg = { brand: 'bg-brand-50', green: 'bg-green-50', amber: 'bg-amber-50' }[color]
  const text = { brand: 'text-brand-700', green: 'text-green-700', amber: 'text-amber-700' }[color]

  return (
    <div className={`${bg} rounded-2xl p-4 flex flex-col items-center text-center gap-1`}>
      <span className="text-2xl">{icon}</span>
      <span className={`text-xl font-bold ${text}`}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

function StatBox({
  value,
  label,
  icon,
}: {
  value: string | number
  label: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center py-5 px-3 gap-1 border-r border-slate-100 last:border-0">
      {icon}
      <span className="text-xl font-bold text-slate-800">{value}</span>
      <span className="text-xs text-slate-400 text-center">{label}</span>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
        ${active
          ? 'border-brand-500 text-brand-600 bg-brand-50/40'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
        }`}
    >
      {children}
    </button>
  )
}

function EmptyState({
  icon,
  title,
  subtitle,
  cta,
  ctaHref,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  cta: string
  ctaHref: string
}) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold text-slate-600 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs mb-6">{subtitle}</p>
      <Link
        href={ctaHref}
        className="bg-brand-600 hover:bg-brand-700 text-white font-semibold
                   text-sm px-6 py-2.5 rounded-full transition-colors"
      >
        {cta}
      </Link>
    </div>
  )
}

function LogroItem({
  title,
  desc,
  locked,
}: {
  title: string
  desc: string
  locked?: boolean
}) {
  return (
    <div className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${locked ? 'opacity-50' : 'bg-green-50'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                       ${locked ? 'bg-slate-100' : 'bg-green-100'}`}>
        <svg className={`w-4 h-4 ${locked ? 'text-slate-400' : 'text-green-500'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {locked
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          }
        </svg>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-700">{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </div>
  )
}
