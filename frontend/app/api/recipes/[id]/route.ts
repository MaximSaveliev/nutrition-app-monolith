import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization");
  
  try {
    const url = `${BACKEND_URL}/api/recipes/${id}`;
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }
    
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const url = `${BACKEND_URL}/api/recipes/${id}`;
    
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating recipe:", error);
    return NextResponse.json({ error: "Failed to update recipe" }, { status: 500 });
  }
}
