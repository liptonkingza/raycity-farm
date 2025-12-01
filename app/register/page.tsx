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
    const [showPassword, setShowPassword] = useState(false)
    const [showSuccessPopup, setShowSuccessPopup] = useState(false)

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

                // Success - show popup
                setShowSuccessPopup(true)
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
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-ocean-depth border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-ocean-teal focus:ring-1 focus:ring-ocean-teal transition-all"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ocean-teal transition-colors"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                )}
                            </button>
                        </div>
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

            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="fixed inset-0 bg-ocean-dark/90 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
                    <div className="glass-panel p-8 rounded-3xl max-w-md w-full mx-4 border border-white/10 shadow-2xl transform scale-100 animate-scaleIn text-center">
                        <div className="w-16 h-16 bg-ocean-teal/10 rounded-full flex items-center justify-center mx-auto mb-4 text-ocean-teal border border-ocean-teal/20">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-white uppercase tracking-wide">Registration Successful!</h3>
                        <p className="text-gray-400 mb-6 text-sm">
                            Please check your email <span className="text-ocean-teal font-bold">{formData.email}</span> to verify your account before logging in.
                        </p>
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full px-6 py-3 bg-ocean-teal text-white hover:bg-teal-600 rounded-xl font-bold shadow-lg shadow-ocean-teal/30 transition-all uppercase tracking-wider"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}
