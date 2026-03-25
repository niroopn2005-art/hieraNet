import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(process.cwd(), 'data', 'records.csv')
    await writeFile(filePath, buffer)

    // Execute IPFS upload and capture only the last line which contains the JSON
    const { stdout, stderr } = await execAsync(`node utils/uploadToIPFS.js "${filePath}"`)
    
    if (stderr) {
      console.error('IPFS Upload Error:', stderr)
    }

    // Get the last line of stdout which should contain our JSON
    const lines = stdout.trim().split('\n')
    const lastLine = lines[lines.length - 1]

    try {
      const result = JSON.parse(lastLine)
      console.log('Successfully uploaded to IPFS. CID:', result.cid)
      return NextResponse.json(result)
    } catch (parseError) {
      console.error('Error parsing stdout:', parseError)
      console.error('Last line content:', lastLine)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to parse IPFS response' 
      })
    }

  } catch (error) {
    console.error('Error in upload:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
} 