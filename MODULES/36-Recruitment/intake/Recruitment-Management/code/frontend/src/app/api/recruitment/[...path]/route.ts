import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }  // ✅ Changed to Promise
) {
  const path = (await params).path.join('/');  // ✅ Await params
  // ... rest of code
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }  // ✅ Changed to Promise
) {
  const path = (await params).path.join('/');  // ✅ Await params
  // ... rest of code
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }  // ✅ Changed to Promise
) {
  const path = (await params).path.join('/');  // ✅ Await params
  // ... rest of code
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }  // ✅ Changed to Promise
) {
  const path = (await params).path.join('/');  // ✅ Await params
  // ... rest of code
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }  // ✅ Changed to Promise
) {
  const path = (await params).path.join('/');  // ✅ Await params
  // ... rest of code
}