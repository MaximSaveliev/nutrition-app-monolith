import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const myRecipes = searchParams.get("my_recipes") || "false";
  const authHeader = request.headers.get("authorization");
  
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (authHeader) headers["Authorization"] = authHeader;
    
    const response = await fetch(`${BACKEND_URL}/api/recipes?my_recipes=${myRecipes}`, { headers });
    const data = await response.json();
    
    if (!response.ok) return NextResponse.json(data, { status: response.status });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  
  try {
    const body = await request.json();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (authHeader) headers["Authorization"] = authHeader;
    
    const response = await fetch(`${BACKEND_URL}/api/recipes`, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    if (!response.ok) return NextResponse.json(data, { status: response.status });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create recipe" }, { status: 500 });
  }
}

