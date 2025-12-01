'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    })
    const [rememberMe, setRememberMe] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // 1. Get email from username
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('email')
                .eq('username', formData.username)
                .single()

            if (profileError || !profileData) {
                throw new Error('Username not found')
            }

            // 2. Sign in with email and password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: profileData.email,
                password: formData.password,
            })

            if (signInError) throw signInError

            // Success - redirect to main page
            router.push('/')
        } catch (err: any) {
            setError(err.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-ocean-dark to-ocean-depth">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-ocean-blue/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-ocean-teal/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
            </div>

            <div className="glass-panel p-8 rounded-3xl max-w-md w-full border border-white/10 shadow-2xl z-10">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 text-center">
                        RC Garage <span className="text-ocean-teal">Login</span>
                    </h1>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-gray-300 mb-2 text-xs font-bold uppercase tracking-wider">
                            Username (ID)
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full bg-ocean-depth border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-ocean-teal focus:ring-1 focus:ring-ocean-teal transition-all"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2 text-xs font-bold uppercase tracking-wider">
                            Password
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-ocean-depth border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-ocean-teal focus:ring-1 focus:ring-ocean-teal transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 bg-ocean-depth border border-white/10 rounded text-ocean-teal focus:ring-ocean-teal focus:ring-2"
                        />
                        <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-300 cursor-pointer">
                            Remember me
                        </label>
                    </div>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 bg-ocean-teal text-white hover:bg-teal-600 rounded-xl font-bold shadow-lg shadow-ocean-teal/30 transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-ocean-teal hover:text-teal-400 font-bold">
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    )
}
