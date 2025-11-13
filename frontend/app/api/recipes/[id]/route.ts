import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization");
  
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (authHeader) headers["Authorization"] = authHeader;
    
    const response = await fetch(`${BACKEND_URL}/api/recipes/${id}`, { headers });
    const data = await response.json();
    
    if (!response.ok) return NextResponse.json(data, { status: response.status });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
  }
}

