'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        phone: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // 1. Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            })

            if (authError) throw authError

            if (authData.user) {
                // 2. Create profile entry
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: authData.user.id,
                            username: formData.username,
                            email: formData.email,
                            phone: formData.phone
                        }
                    ])

                if (profileError) throw profileError

                // Success - redirect to login
                alert('Registration successful! Please login.')
                router.push('/login')
            }
        } catch (err: any) {
            setError(err.message || 'Registration failed')
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
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        RC Garage <span className="text-ocean-teal">Register</span>
                    </h1>
                    <div className="h-1 w-16 bg-gradient-to-r from-ocean-blue to-ocean-teal mx-auto rounded-full"></div>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
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
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-ocean-depth border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-ocean-teal focus:ring-1 focus:ring-ocean-teal transition-all"
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2 text-xs font-bold uppercase tracking-wider">
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-ocean-depth border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-ocean-teal focus:ring-1 focus:ring-ocean-teal transition-all"
                            placeholder="0812345678"
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
                            minLength={6}
                        />
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
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="text-ocean-teal hover:text-teal-400 font-bold">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    )
}
