import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'timer-records.json')

interface TimerRecord {
    id: string
    date: string
    duration: number
    amount: number
    hourlyRate: number
}

interface DataStructure {
    records: TimerRecord[]
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
            await fs.writeFile(DATA_FILE, JSON.stringify({ records: [] }, null, 2))
        }
    } catch (error) {
        console.error('Error ensuring data file:', error)
    }
}

// GET - Read all records
export async function GET() {
    try {
        await ensureDataFile()
        const fileContents = await fs.readFile(DATA_FILE, 'utf8')
        const data: DataStructure = JSON.parse(fileContents)
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error reading records:', error)
        return NextResponse.json({ records: [] }, { status: 500 })
    }
}

// POST - Add new record
export async function POST(request: NextRequest) {
    try {
        await ensureDataFile()
        const newRecord: TimerRecord = await request.json()

        const fileContents = await fs.readFile(DATA_FILE, 'utf8')
        const data: DataStructure = JSON.parse(fileContents)

        data.records.unshift(newRecord) // Add to beginning of array

        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))

        return NextResponse.json({ success: true, record: newRecord })
    } catch (error) {
        console.error('Error saving record:', error)
        return NextResponse.json({ success: false, error: 'Failed to save record' }, { status: 500 })
    }
}

// PUT - Update existing record
export async function PUT(request: NextRequest) {
    try {
        await ensureDataFile()
        const updatedRecord: TimerRecord = await request.json()

        const fileContents = await fs.readFile(DATA_FILE, 'utf8')
        const data: DataStructure = JSON.parse(fileContents)

        const index = data.records.findIndex(record => record.id === updatedRecord.id)

        if (index === -1) {
            return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 })
        }

        data.records[index] = updatedRecord

        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))

        return NextResponse.json({ success: true, record: updatedRecord })
    } catch (error) {
        console.error('Error updating record:', error)
        return NextResponse.json({ success: false, error: 'Failed to update record' }, { status: 500 })
    }
}

// DELETE - Delete record by ID
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

        const initialLength = data.records.length
        data.records = data.records.filter(record => record.id !== id)

        if (data.records.length === initialLength) {
            return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 })
        }

        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting record:', error)
        return NextResponse.json({ success: false, error: 'Failed to delete record' }, { status: 500 })
    }
}
