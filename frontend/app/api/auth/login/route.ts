import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Login request received:", body);

    const backendOrigin = (
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3001"
    ).replace(/\/$/, "");
    const backendUrl = `${backendOrigin}/api/auth/login`;
    console.log("Forwarding to:", backendUrl);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("Backend response status:", response.status);

    const data = await response.json();
    console.log("Backend response data:", data);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to connect to backend. Make sure it's running on port 3001.",
      },
      { status: 500 },
    );
  }
}
