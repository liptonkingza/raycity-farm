import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'transactions.json')

interface Transaction {
    id: string
    status: 'ซื้อ' | 'ขาย' | 'เทริน'
    item: string
    dateTime: string
    rainPrice: number
    bahtPrice: number
    note: string
}

interface DataStructure {
    transactions: Transaction[]
}

// Ensure data directory and file exist
async function ensureDataFile() {
    try {
        const dataDir = path.dirname(DATA_FILE)
        await fs.mkdir(dataDir, { recursive: true })

        try {
            await fs.access(DATA_FILE)
        } catch {
            // File doesn't exist, create it
            await fs.writeFile(DATA_FILE, JSON.stringify({ transactions: [] }, null, 2))
        }
    } catch (error) {
        console.error('Error ensuring data file:', error)
    }
}

// GET - Read all transactions
export async function GET() {
    try {
        await ensureDataFile()
        const fileContents = await fs.readFile(DATA_FILE, 'utf8')
        const data: DataStructure = JSON.parse(fileContents)
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error reading transactions:', error)
        return NextResponse.json({ transactions: [] }, { status: 500 })
    }
}

// POST - Add new transaction
export async function POST(request: NextRequest) {
    try {
        await ensureDataFile()
        const newTransaction: Transaction = await request.json()

        const fileContents = await fs.readFile(DATA_FILE, 'utf8')
        const data: DataStructure = JSON.parse(fileContents)

        data.transactions.unshift(newTransaction) // Add to beginning of array

        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))

        return NextResponse.json({ success: true, transaction: newTransaction })
    } catch (error) {
        console.error('Error saving transaction:', error)
        return NextResponse.json({ success: false, error: 'Failed to save transaction' }, { status: 500 })
    }
}

// PUT - Update existing transaction
export async function PUT(request: NextRequest) {
    try {
        await ensureDataFile()
        const updatedTransaction: Transaction = await request.json()

        const fileContents = await fs.readFile(DATA_FILE, 'utf8')
        const data: DataStructure = JSON.parse(fileContents)

        const index = data.transactions.findIndex(t => t.id === updatedTransaction.id)

        if (index === -1) {
            return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 })
        }

        data.transactions[index] = updatedTransaction

        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))

        return NextResponse.json({ success: true, transaction: updatedTransaction })
    } catch (error) {
        console.error('Error updating transaction:', error)
        return NextResponse.json({ success: false, error: 'Failed to update transaction' }, { status: 500 })
    }
}

// DELETE - Delete transaction by ID
export async function DELETE(request: NextRequest) {
    try {
        await ensureDataFile()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
        }

        const fileContents = await fs.readFile(DATA_FILE, 'utf8')
        const data: DataStructure = JSON.parse(fileContents)

        const initialLength = data.transactions.length
        data.transactions = data.transactions.filter(t => t.id !== id)

        if (data.transactions.length === initialLength) {
            return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 })
        }

        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting transaction:', error)
        return NextResponse.json({ success: false, error: 'Failed to delete transaction' }, { status: 500 })
    }
}
