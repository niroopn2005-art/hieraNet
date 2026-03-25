import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    // Path to the CSV file in public/data folder
    const filePath = path.join(process.cwd(), 'public', 'data', 'iot-sensor-data.csv');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'IoT sensor data file not found. Please ensure iot-sensor-data.csv is in public/data/ folder.' },
        { status: 404 }
      );
    }

    // Read the CSV file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.trim().split('\n');
    
    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: 'CSV file is empty or has no data rows' },
        { status: 400 }
      );
    }

    // Parse CSV header
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Parse CSV data rows
    const jsonData: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const record: any = {};
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        // Convert to number if it looks like a number
        record[header] = !isNaN(Number(value)) && value !== '' ? Number(value) : value;
      });
      jsonData.push(record);
    }
    
    if (jsonData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data found in CSV file' },
        { status: 400 }
      );
    }

    // Get 25 random records
    const recordCount = Math.min(25, jsonData.length);
    const randomRecords: any[] = [];
    const usedIndices = new Set<number>();
    
    while (randomRecords.length < recordCount) {
      const randomIndex = Math.floor(Math.random() * jsonData.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        randomRecords.push(jsonData[randomIndex]);
      }
    }

    console.log(`📊 IoT Simulation: Retrieved ${randomRecords.length} sensor readings`);
    console.log('Sample reading:', randomRecords[0]);

    return NextResponse.json({
      success: true,
      data: randomRecords,
      count: randomRecords.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error reading IoT sensor data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to read IoT sensor data',
        details: 'Make sure iot-sensor-data.csv exists in public/data/ folder and has the correct format'
      },
      { status: 500 }
    );
  }
}
