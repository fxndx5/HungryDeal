'use client'

import { useState } from 'react'
import Image from 'next/image'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

type Mode = 'login' | 'register'

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  function resetAndClose() {
    setMode('login')
    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
    setError('')
    setShowPassword(false)
    onClose()
  }

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    try {
      const endpoint = mode === 'login'
        ? `${apiUrl}/api/v1/auth/login`
        : `${apiUrl}/api/v1/auth/register`

      const body = mode === 'login'
        ? { email, password }
        : { email, password, first_name: firstName || null, last_name: lastName || null }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Ha ocurrido un error')
        return
      }

      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user_email', data.user.email)
      if (data.user.first_name) {
        localStorage.setItem('user_name', data.user.first_name)
      }

      resetAndClose()
      window.location.reload()
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={resetAndClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Boton cerrar */}
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center
                     rounded-full hover:bg-slate-100 transition-colors text-slate-400
                     hover:text-slate-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Logo */}
          <div className="mb-5">
            <Image src="/logo.png" alt="HungryDeal" width={48} height={48} />
          </div>

          {mode === 'login' ? (
            <>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Bienvenido de nuevo.</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Correo electronico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                    className="w-full border border-slate-300 rounded-lg px-4 py-3
                               text-slate-800 placeholder-slate-400 text-sm outline-none
                               focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Contrasena
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Contrasena"
                      className="w-full border border-slate-300 rounded-lg px-4 py-3 pr-12
                                 text-slate-800 placeholder-slate-400 text-sm outline-none
                                 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                                 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold
                             py-3 rounded-full transition-colors disabled:opacity-50
                             disabled:cursor-not-allowed text-sm"
                >
                  {loading ? 'Cargando...' : 'Iniciar sesion'}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">No tienes cuenta?</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <p className="mt-4 text-center text-sm text-slate-600">
                <button
                  onClick={() => switchMode('register')}
                  className="text-brand-600 hover:text-brand-700 font-semibold underline underline-offset-2"
                >
                  Registrate
                </button>{' '}
                para sacar el maximo de HungryDeal.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                Registrate en HungryDeal
              </h2>
              <p className="text-sm text-slate-400 mb-6">Compara precios y ahorra en cada pedido.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Nombre"
                      className="w-full border border-slate-300 rounded-lg px-3 py-3
                                 text-slate-800 placeholder-slate-400 text-sm outline-none
                                 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Apellido"
                      className="w-full border border-slate-300 rounded-lg px-3 py-3
                                 text-slate-800 placeholder-slate-400 text-sm outline-none
                                 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Correo electronico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                    className="w-full border border-slate-300 rounded-lg px-4 py-3
                               text-slate-800 placeholder-slate-400 text-sm outline-none
                               focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Crear contrasena
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Minimo 6 caracteres"
                      className="w-full border border-slate-300 rounded-lg px-4 py-3 pr-12
                                 text-slate-800 placeholder-slate-400 text-sm outline-none
                                 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                                 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold
                             py-3 rounded-full transition-colors disabled:opacity-50
                             disabled:cursor-not-allowed text-sm"
                >
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">Ya tienes cuenta?</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <p className="mt-4 text-center text-sm">
                <button
                  onClick={() => switchMode('login')}
                  className="text-brand-600 hover:text-brand-700 font-semibold underline underline-offset-2"
                >
                  Inicia sesion
                </button>{' '}
                <span className="text-slate-500">con tu cuenta de HungryDeal.</span>
              </p>
            </>
          )}

          <p className="mt-5 text-xs text-slate-400 text-center leading-relaxed">
            Al continuar aceptas los Terminos de Uso y la Politica de Privacidad.
          </p>
        </div>
      </div>
    </div>
  )
}
