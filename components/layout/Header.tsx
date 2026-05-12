import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.is_admin ?? false
  }

  return (
    <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#3589F2] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xs">SK</span>
          </div>
          <span className="font-black text-base tracking-tight"
                style={{ fontFamily: 'Montserrat, sans-serif' }}>
            SKYG
            <span className="text-[#3589F2]"> Academy</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-[#3589F2] transition-colors">Cursos</Link>
          {user && (
            <Link href="/dashboard" className="hover:text-[#3589F2] transition-colors">
              Mi aprendizaje
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin"
              className="text-[#E8004A] hover:text-[#b50038] transition-colors font-semibold">
              Admin
            </Link>
          )}
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <form action="/api/auth/signout" method="POST">
              <button type="submit"
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                Salir
              </button>
            </form>
          ) : (
            <>
              <Link href="/login"
                className="text-sm font-medium text-gray-600 hover:text-[#3589F2] transition-colors">
                Entrar
              </Link>
              <Link href="/registro" className="btn-primary text-xs px-4 py-2">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
