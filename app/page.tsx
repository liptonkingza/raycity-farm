'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface TimerRecord {
    id: number
    created_at: string
    date: string
    duration: number
    amount: number
    hourly_rate: number
}

interface Transaction {
    id: number
    created_at: string
    status: 'ซื้อ' | 'ขาย' | 'เทริน'
    item: string
    date_time: string
    rain_price: number
    baht_price: number
    note: string
}

type TabType = 'timer' | 'summary' | 'buysell' | 'backup'

export default function TimerPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<TabType>('timer')

    // Timer State
    const [time, setTime] = useState(0)
    const [isRunning, setIsRunning] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [amount, setAmount] = useState('')
    const [savedTime, setSavedTime] = useState(0)
    const [records, setRecords] = useState<TimerRecord[]>([])
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Edit/Delete Timer Record State
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingRecord, setEditingRecord] = useState<TimerRecord | null>(null)
    const [editAmount, setEditAmount] = useState('')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    // Transaction State
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [showAddTransactionModal, setShowAddTransactionModal] = useState(false)
    const [showEditTransactionModal, setShowEditTransactionModal] = useState(false)
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
    const [showDeleteTransactionConfirm, setShowDeleteTransactionConfirm] = useState(false)
    const [deletingTransactionId, setDeletingTransactionId] = useState<number | null>(null)

    // Transaction Form State
    const [transactionForm, setTransactionForm] = useState({
        status: 'ซื้อ' as 'ซื้อ' | 'ขาย' | 'เทริน',
        item: '',
        rainPrice: '',
        bahtPrice: '',
        note: ''
    })

    // Check authentication on mount
    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            router.push('/login')
            return
        }

        setUser(session.user)
        setLoading(false)
        fetchRecords()
        fetchTransactions()
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const fetchRecords = async () => {
        const { data, error } = await supabase
            .from('timer_records')
            .select('*')
            .order('date', { ascending: false })

        if (error) {
            console.error('Error fetching records:', error)
        } else {
            setRecords(data || [])
        }
    }

    const fetchTransactions = async () => {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('date_time', { ascending: false })

        if (error) {
            console.error('Error fetching transactions:', error)
        } else {
            setTransactions(data || [])
        }
    }

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTime((prevTime) => prevTime + 10)
            }, 10)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [isRunning])

    const formatTime = (milliseconds: number) => {
        const totalSeconds = Math.floor(milliseconds / 1000)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60
        const ms = Math.floor((milliseconds % 1000) / 10)

        return {
            hours: hours.toString().padStart(2, '0'),
            minutes: minutes.toString().padStart(2, '0'),
            seconds: seconds.toString().padStart(2, '0'),
            milliseconds: ms.toString().padStart(2, '0'),
        }
    }

    const formatDuration = (milliseconds: number) => {
        const totalSeconds = Math.floor(milliseconds / 1000)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        if (hours > 0) {
            return `${hours} ชั่วโมง ${minutes} นาที ${seconds} วินาที`
        } else if (minutes > 0) {
            return `${minutes} นาที ${seconds} วินาที`
        } else {
            return `${seconds} วินาที`
        }
    }

    const calculateHourlyRate = (milliseconds: number, amount: number) => {
        const hours = milliseconds / (1000 * 60 * 60)
        return hours > 0 ? amount / hours : 0
    }

    const handleStart = () => {
        setIsRunning(true)
    }

    const handlePause = () => {
        setIsRunning(false)
    }

    const handleFinish = () => {
        setIsRunning(false)
        setSavedTime(time)
        setAmount('1000000')
        setShowModal(true)
    }

    const handleSaveRecord = async () => {
        const amountNum = parseFloat(amount)
        if (isNaN(amountNum) || amountNum <= 0) {
            alert('กรุณากรอกจำนวนเงินที่ถูกต้อง')
            return
        }

        const hourlyRate = calculateHourlyRate(savedTime, amountNum)

        const { error } = await supabase
            .from('timer_records')
            .insert([
                {
                    user_id: user?.id,
                    date: new Date().toISOString(),
                    duration: savedTime,
                    amount: amountNum,
                    hourly_rate: hourlyRate,
                }
            ])

        if (error) {
            console.error('Error saving record:', error)
            alert('Failed to save record')
        } else {
            setShowModal(false)
            setAmount('')
            setTime(0)
            setSavedTime(0)
            fetchRecords()
        }
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setAmount('')
        setTime(0)
        setSavedTime(0)
    }

    // Edit functions
    const handleEdit = (record: TimerRecord) => {
        setEditingRecord(record)
        setEditAmount(record.amount.toString())
        setShowEditModal(true)
    }

    const handleSaveEdit = async () => {
        if (!editingRecord) return

        const amountNum = parseFloat(editAmount)
        if (isNaN(amountNum) || amountNum <= 0) {
            alert('กรุณากรอกจำนวนเงินที่ถูกต้อง')
            return
        }

        const hourlyRate = calculateHourlyRate(editingRecord.duration, amountNum)

        const { error } = await supabase
            .from('timer_records')
            .update({
                amount: amountNum,
                hourly_rate: hourlyRate
            })
            .eq('id', editingRecord.id)

        if (error) {
            console.error('Error updating record:', error)
            alert('Failed to update record')
        } else {
            setShowEditModal(false)
            setEditingRecord(null)
            setEditAmount('')
            fetchRecords()
        }
    }

    const handleCloseEditModal = () => {
        setShowEditModal(false)
        setEditingRecord(null)
        setEditAmount('')
    }

    // Delete functions
    const handleDelete = (id: number) => {
        setDeletingId(id)
        setShowDeleteConfirm(true)
    }

    const confirmDelete = async () => {
        if (!deletingId) return

        const { error } = await supabase
            .from('timer_records')
            .delete()
            .eq('id', deletingId)

        if (error) {
            console.error('Error deleting record:', error)
            alert('Failed to delete record')
        } else {
            setShowDeleteConfirm(false)
            setDeletingId(null)
            fetchRecords()
        }
    }

    // Transaction functions
    const handleAddTransaction = () => {
        setTransactionForm({
            status: 'ซื้อ',
            item: '',
            rainPrice: '',
            bahtPrice: '',
            note: ''
        })
        setShowAddTransactionModal(true)
    }

    const handleSaveTransaction = async () => {
        if (!transactionForm.item) {
            alert('กรุณากรอกชื่อรายการ')
            return
        }

        const { error } = await supabase
            .from('transactions')
            .insert([
                {
                    user_id: user?.id,
                    status: transactionForm.status,
                    item: transactionForm.item,
                    date_time: new Date().toISOString(),
                    rain_price: parseFloat(transactionForm.rainPrice) || 0,
                    baht_price: parseFloat(transactionForm.bahtPrice) || 0,
                    note: transactionForm.note
                }
            ])

        if (error) {
            console.error('Error saving transaction:', error)
            alert('Failed to save transaction')
        } else {
            setShowAddTransactionModal(false)
            fetchTransactions()
        }
    }

    const handleEditTransaction = (transaction: Transaction) => {
        setEditingTransaction(transaction)
        setTransactionForm({
            status: transaction.status,
            item: transaction.item,
            rainPrice: transaction.rain_price.toString(),
            bahtPrice: transaction.baht_price.toString(),
            note: transaction.note
        })
        setShowEditTransactionModal(true)
    }

    const handleSaveEditTransaction = async () => {
        if (!editingTransaction) return

        if (!transactionForm.item) {
            alert('กรุณากรอกชื่อรายการ')
            return
        }

        const { error } = await supabase
            .from('transactions')
            .update({
                status: transactionForm.status,
                item: transactionForm.item,
                rain_price: parseFloat(transactionForm.rainPrice) || 0,
                baht_price: parseFloat(transactionForm.bahtPrice) || 0,
                note: transactionForm.note
            })
            .eq('id', editingTransaction.id)

        if (error) {
            console.error('Error updating transaction:', error)
            alert('Failed to update transaction')
        } else {
            setShowEditTransactionModal(false)
            setEditingTransaction(null)
            fetchTransactions()
        }
    }

    const handleDeleteTransaction = (id: number) => {
        setDeletingTransactionId(id)
        setShowDeleteTransactionConfirm(true)
    }

    const confirmDeleteTransaction = async () => {
        if (!deletingTransactionId) return

        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', deletingTransactionId)

        if (error) {
            console.error('Error deleting transaction:', error)
            alert('Failed to delete transaction')
        } else {
            setShowDeleteTransactionConfirm(false)
            setDeletingTransactionId(null)
            fetchTransactions()
        }
    }

    const { hours, minutes, seconds, milliseconds } = formatTime(time)

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-ocean-dark to-ocean-depth">
                <div className="text-ocean-teal text-xl font-bold">Loading...</div>
            </main>
        )
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-ocean-dark to-ocean-depth text-white">
            {/* Background Animations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-ocean-blue/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-ocean-teal/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
            </div>

            <div className="z-10 w-full max-w-5xl">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-lg whitespace-nowrap">
                            RC Garage <span className="text-ocean-teal">Log</span>
                        </h1>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500 hover:text-white transition-all text-sm font-bold uppercase tracking-wider whitespace-nowrap ml-4"
                        >
                            Logout
                        </button>
                    </div>
                    <div className="h-1 w-24 bg-gradient-to-r from-ocean-blue to-ocean-teal rounded-full opacity-80 mt-4"></div>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center mb-10">
                    <div className="bg-ocean-depth/50 backdrop-blur-md p-1 rounded-xl flex space-x-2 border border-white/5 shadow-lg overflow-x-auto max-w-full">
                        <button
                            onClick={() => setActiveTab('timer')}
                            className={`px-6 py-2 rounded-lg transition-all duration-300 font-medium tracking-wide whitespace-nowrap ${activeTab === 'timer'
                                ? 'bg-gradient-to-r from-ocean-blue/20 to-ocean-teal/20 text-ocean-blue border border-ocean-blue/30 shadow-soft-blue'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Timer
                        </button>
                        <button
                            onClick={() => setActiveTab('summary')}
                            className={`px-6 py-2 rounded-lg transition-all duration-300 font-medium tracking-wide whitespace-nowrap ${activeTab === 'summary'
                                ? 'bg-gradient-to-r from-ocean-blue/20 to-ocean-teal/20 text-ocean-blue border border-ocean-blue/30 shadow-soft-blue'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Summary
                        </button>
                        <button
                            onClick={() => setActiveTab('buysell')}
                            className={`px-6 py-2 rounded-lg transition-all duration-300 font-medium tracking-wide whitespace-nowrap ${activeTab === 'buysell'
                                ? 'bg-gradient-to-r from-ocean-blue/20 to-ocean-teal/20 text-ocean-blue border border-ocean-blue/30 shadow-soft-blue'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Buy / Sell
                        </button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'timer' && (
                    <div className="flex flex-col items-center space-y-10 animate-fadeIn">
                        {/* Timer Display */}
                        <div className="glass-panel p-16 rounded-3xl relative overflow-hidden group w-full max-w-2xl mx-auto border-white/5">
                            <div className="absolute inset-0 bg-gradient-to-br from-ocean-blue/5 to-ocean-teal/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <div className="relative z-10 flex flex-col items-center px-10">
                                <div className="flex items-baseline justify-center font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 drop-shadow-xl font-sans tabular-nums">
                                    <span className="text-6xl md:text-8xl">
                                        {hours}:{minutes}:{seconds}
                                    </span>
                                    <span className="text-3xl md:text-4xl text-ocean-teal/60 ml-2">
                                        .{milliseconds}
                                    </span>
                                </div>
                                <div className="mt-8 flex items-center justify-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-ocean-teal shadow-soft-teal animate-pulse' : 'bg-gray-600'}`}></div>
                                    <span className="text-ocean-blue uppercase tracking-widest text-sm font-semibold">
                                        {isRunning ? 'System Active' : time > 0 ? 'System Paused' : 'System Ready'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex space-x-6 w-full max-w-2xl justify-center">
                            {!isRunning ? (
                                <button
                                    onClick={handleStart}
                                    className="flex-1 px-8 py-4 bg-gradient-to-r from-ocean-teal to-teal-600 hover:from-ocean-teal/90 hover:to-teal-500 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-soft-teal transition-all duration-300 flex items-center justify-center space-x-2 transform hover:-translate-y-0.5"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <span>Start</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handlePause}
                                    className="flex-1 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-amber-500/20 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:-translate-y-0.5"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <span>Pause</span>
                                </button>
                            )}
                            <button
                                onClick={handleFinish}
                                disabled={time === 0}
                                className="flex-1 px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-rose-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center justify-center space-x-2 transform hover:-translate-y-0.5"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span>Finish</span>
                            </button>
                        </div>

                        {/* Recent History (Top 5) */}
                        <div className="w-full max-w-2xl mt-12">
                            <h2 className="text-xl font-bold mb-6 text-ocean-light tracking-wide flex items-center">
                                <span className="w-1.5 h-6 bg-ocean-teal mr-3 rounded-full"></span>
                                Recent Logs
                            </h2>
                            <div className="space-y-4">
                                {records.slice(0, 5).map((record) => (
                                    <div key={record.id} className="glass-panel p-4 rounded-xl flex justify-between items-center hover:bg-white/5 transition-colors border-l-4 border-l-ocean-teal/50">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-lg bg-ocean-depth border border-white/10 flex items-center justify-center text-ocean-teal">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase tracking-wider">{new Date(record.date).toLocaleString('th-TH')}</div>
                                                <div className="font-mono text-lg text-white">{formatDuration(record.duration)}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-ocean-teal">{record.amount.toLocaleString()} Rain</div>
                                        </div>
                                    </div>
                                ))}
                                {records.length === 0 && (
                                    <div className="text-center text-gray-500 py-8 border border-dashed border-gray-700 rounded-xl bg-ocean-depth/30">No Data Logged</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'summary' && (
                    <div className="w-full animate-fadeIn space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-ocean-blue">
                                <div className="text-gray-400 mb-2 uppercase tracking-wider text-xs">Total Records</div>
                                <div className="text-4xl font-bold text-white">{records.length} <span className="text-lg text-gray-500 font-normal">Items</span></div>
                            </div>
                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-ocean-teal">
                                <div className="text-gray-400 mb-2 uppercase tracking-wider text-xs">Total Time</div>
                                <div className="text-4xl font-bold text-ocean-teal">
                                    {formatDuration(records.reduce((acc, curr) => acc + curr.duration, 0))}
                                </div>
                            </div>
                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-emerald-500">
                                <div className="text-gray-400 mb-2 uppercase tracking-wider text-xs">Total Earnings (Rain)</div>
                                <div className="text-4xl font-bold text-emerald-400">
                                    {records.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} Rain
                                </div>
                            </div>
                        </div>

                        {/* Full History Table */}
                        <div className="glass-panel rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white tracking-wide">Full History</h2>
                                <div className="text-xs text-gray-500 uppercase">System Log v1.0</div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-ocean-depth/80">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Date / Time</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Duration</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-300 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {records.map((record) => (
                                            <tr key={record.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4 text-sm text-gray-300 font-mono">
                                                    {new Date(record.date).toLocaleString('th-TH')}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono text-white">
                                                    {formatDuration(record.duration)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right font-bold text-emerald-400 font-mono">
                                                    {record.amount.toLocaleString()} Rain
                                                </td>
                                                <td className="px-6 py-4 text-sm text-center space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(record)}
                                                        className="px-3 py-1 bg-ocean-blue/10 text-ocean-blue rounded hover:bg-ocean-blue hover:text-white transition-colors text-xs font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(record.id)}
                                                        className="px-3 py-1 bg-rose-500/10 text-rose-400 rounded hover:bg-rose-500 hover:text-white transition-colors text-xs font-medium"
                                                    >
                                                        Del
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {records.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                    No Data Available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'buysell' && (
                    <div className="w-full animate-fadeIn space-y-8">
                        {/* Header & Add Button */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white tracking-wide flex items-center">
                                <span className="w-1.5 h-8 bg-ocean-teal mr-3 rounded-full"></span>
                                Transaction Log
                            </h2>
                            <button
                                onClick={handleAddTransaction}
                                className="px-6 py-2 bg-ocean-teal hover:bg-teal-600 text-white rounded-lg shadow-lg shadow-ocean-teal/20 transition-all flex items-center space-x-2 font-bold tracking-wide transform hover:-translate-y-0.5"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                <span>New Entry</span>
                            </button>
                        </div>

                        {/* Transactions Table */}
                        <div className="glass-panel rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-ocean-depth/80">
                                        <tr>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Item</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Date / Time</th>
                                            <th className="px-4 py-4 text-right text-xs font-bold text-gray-300 uppercase tracking-wider">Rain</th>
                                            <th className="px-4 py-4 text-right text-xs font-bold text-gray-300 uppercase tracking-wider">Baht</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">Note</th>
                                            <th className="px-4 py-4 text-center text-xs font-bold text-gray-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {transactions.map((t) => (
                                            <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-4 py-4">
                                                    <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${t.status === 'ซื้อ' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                        t.status === 'ขาย' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                        }`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-white font-medium">{t.item}</td>
                                                <td className="px-4 py-4 text-sm text-gray-400 font-mono">
                                                    {new Date(t.date_time).toLocaleString('th-TH')}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-right text-ocean-blue font-mono">
                                                    {t.rain_price.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-right text-emerald-400 font-mono font-bold">
                                                    {t.baht_price.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-400 truncate max-w-[150px]">{t.note}</td>
                                                <td className="px-4 py-4 text-sm text-center space-x-2">
                                                    <button
                                                        onClick={() => handleEditTransaction(t)}
                                                        className="px-2 py-1 bg-ocean-blue/10 text-ocean-blue rounded hover:bg-ocean-blue hover:text-white transition-colors text-xs font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTransaction(t.id)}
                                                        className="px-2 py-1 bg-rose-500/10 text-rose-400 rounded hover:bg-rose-500 hover:text-white transition-colors text-xs font-medium"
                                                    >
                                                        Del
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {transactions.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                    No Transactions Logged
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-ocean-dark/90 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
                    <div className="glass-panel p-8 rounded-3xl max-w-md w-full mx-4 border border-white/10 shadow-2xl transform scale-100 animate-scaleIn">
                        <h3 className="text-2xl font-bold mb-6 text-center text-white tracking-wide">Save Record</h3>
                        <div className="space-y-6">
                            <div className="bg-ocean-depth border border-white/5 p-4 rounded-xl text-center">
                                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Duration</div>
                                <div className="text-3xl font-mono font-bold text-ocean-teal">{formatDuration(savedTime)}</div>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-xs font-bold uppercase tracking-wider">Amount (Rain)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-ocean-depth border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-ocean-teal focus:ring-1 focus:ring-ocean-teal transition-all text-lg font-mono text-right"
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>
                            <div className="flex space-x-4 pt-4">
                                <button
                                    onClick={handleCloseModal}
                                    className="flex-1 px-6 py-3 border border-gray-600 text-gray-400 hover:border-white hover:text-white rounded-xl font-bold transition-colors uppercase tracking-wider text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveRecord}
                                    className="flex-1 px-6 py-3 bg-ocean-teal text-white hover:bg-teal-600 rounded-xl font-bold shadow-lg shadow-ocean-teal/30 transition-colors uppercase tracking-wider text-sm"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Timer Record Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-ocean-dark/90 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
                    <div className="glass-panel p-8 rounded-3xl max-w-md w-full mx-4 border border-white/10 shadow-2xl transform scale-100 animate-scaleIn">
                        <h3 className="text-2xl font-bold mb-6 text-center text-white tracking-wide">Edit Record</h3>
                        <div className="space-y-6">
                            <div className="bg-ocean-depth border border-white/5 p-4 rounded-xl text-center">
                                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Duration</div>
                                <div className="text-3xl font-mono font-bold text-ocean-teal">
                                    {editingRecord ? formatDuration(editingRecord.duration) : '00:00:00'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-xs font-bold uppercase tracking-wider">Amount (Rain)</label>
                                <input
                                    type="number"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                    className="w-full bg-ocean-depth border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-ocean-teal focus:ring-1 focus:ring-ocean-teal transition-all text-lg font-mono text-right"
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>
                            <div className="flex space-x-4 pt-4">
                                <button
                                    onClick={handleCloseEditModal}
                                    className="flex-1 px-6 py-3 border border-gray-600 text-gray-400 hover:border-white hover:text-white rounded-xl font-bold transition-colors uppercase tracking-wider text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 px-6 py-3 bg-ocean-teal text-white hover:bg-teal-600 rounded-xl font-bold shadow-lg shadow-ocean-teal/30 transition-colors uppercase tracking-wider text-sm"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Timer Record Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-ocean-dark/90 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
                    <div className="glass-panel p-8 rounded-3xl max-w-sm w-full mx-4 border border-white/10 shadow-2xl transform scale-100 animate-scaleIn text-center">
                        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 border border-rose-500/20">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white uppercase tracking-wide">Confirm Deletion</h3>
                        <p className="text-gray-400 mb-6 text-sm">Are you sure you want to delete this record? This action cannot be undone.</p>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-600 text-gray-400 hover:border-white hover:text-white rounded-xl font-bold transition-colors uppercase tracking-wider text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-rose-600 text-white hover:bg-rose-500 rounded-xl font-bold shadow-lg shadow-rose-600/30 transition-colors uppercase tracking-wider text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Transaction Modal */}
            {(showAddTransactionModal || showEditTransactionModal) && (
                <div className="fixed inset-0 bg-ocean-dark/90 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
                    <div className="glass-panel p-8 rounded-3xl max-w-md w-full mx-4 border border-white/10 shadow-2xl transform scale-100 animate-scaleIn">
                        <h3 className="text-2xl font-bold mb-6 text-center text-white tracking-wide">
                            {showAddTransactionModal ? 'New Transaction' : 'Edit Transaction'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-300 mb-2 text-xs font-bold uppercase tracking-wider">Status</label>
                                <select
                                    value={transactionForm.status}
                                    onChange={(e) => setTransactionForm({ ...transactionForm, status: e.target.value as any })}
                                    className="w-full bg-ocean-depth border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ocean-teal focus:ring-1 focus:ring-ocean-teal"
                                >
                                    <option value="ซื้อ" className="bg-ocean-depth">ซื้อ (Buy)</option>
                                    <option value="ขาย" className="bg-ocean-depth">ขาย (Sell)</option>
                                    <option value="เทริน" className="bg-ocean-depth">เทริน (Trade)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-xs font-bold uppercase tracking-wider">Item Name</label>
                                <input
                                    type="text"
                                    value={transactionForm.item}
                                    onChange={(e) => setTransactionForm({ ...transactionForm, item: e.target.value })}
                                    className="w-full bg-ocean-depth border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-ocean-teal focus:ring-1 focus:ring-ocean-teal"
                                    placeholder="Item Name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 mb-2 text-xs font-bold uppercase tracking-wider">Rain</label>
                                    <input
                                        type="number"
                                        value={transactionForm.rainPrice}
                                        onChange={(e) => setTransactionForm({ ...transactionForm, rainPrice: e.target.value })}
                                        className="w-full bg-ocean-depth border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-ocean-teal focus:ring-1 focus:ring-ocean-teal text-right font-mono"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2 text-xs font-bold uppercase tracking-wider">Baht</label>
                                    <input
                                        type="number"
                                        value={transactionForm.bahtPrice}
                                        onChange={(e) => setTransactionForm({ ...transactionForm, bahtPrice: e.target.value })}
                                        className="w-full bg-ocean-depth border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-ocean-teal focus:ring-1 focus:ring-ocean-teal text-right font-mono"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-xs font-bold uppercase tracking-wider">Note</label>
                                <textarea
                                    value={transactionForm.note}
                                    onChange={(e) => setTransactionForm({ ...transactionForm, note: e.target.value })}
                                    className="w-full bg-ocean-depth border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-ocean-teal focus:ring-1 focus:ring-ocean-teal h-24 resize-none"
                                    placeholder="Additional notes..."
                                />
                            </div>
                            <div className="flex space-x-4 pt-4">
                                <button
                                    onClick={() => {
                                        setShowAddTransactionModal(false)
                                        setShowEditTransactionModal(false)
                                    }}
                                    className="flex-1 px-6 py-3 border border-gray-600 text-gray-400 hover:border-white hover:text-white rounded-xl font-bold transition-colors uppercase tracking-wider text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={showAddTransactionModal ? handleSaveTransaction : handleSaveEditTransaction}
                                    className="flex-1 px-6 py-3 bg-ocean-teal text-white hover:bg-teal-600 rounded-xl font-bold shadow-lg shadow-ocean-teal/30 transition-colors uppercase tracking-wider text-sm"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Transaction Confirmation */}
            {showDeleteTransactionConfirm && (
                <div className="fixed inset-0 bg-ocean-dark/90 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
                    <div className="glass-panel p-8 rounded-3xl max-w-sm w-full mx-4 border border-white/10 shadow-2xl transform scale-100 animate-scaleIn text-center">
                        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 border border-rose-500/20">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white uppercase tracking-wide">Confirm Deletion</h3>
                        <p className="text-gray-400 mb-6 text-sm">Are you sure you want to delete this transaction? This action cannot be undone.</p>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setShowDeleteTransactionConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-600 text-gray-400 hover:border-white hover:text-white rounded-xl font-bold transition-colors uppercase tracking-wider text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteTransaction}
                                className="flex-1 px-4 py-2 bg-rose-600 text-white hover:bg-rose-500 rounded-xl font-bold shadow-lg shadow-rose-600/30 transition-colors uppercase tracking-wider text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
