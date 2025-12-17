import { type NextRequest, NextResponse } from "next/server"

const RPC_URL = "https://octra.network"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, method = "GET", data } = body

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
    }

    const url = `${RPC_URL}${endpoint}`
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    const requestHeaders = request.headers

    // Check for X-Private-Key in request headers
    const privateKeyFromHeader = requestHeaders.get("x-private-key")
    if (privateKeyFromHeader) {
      headers["X-Private-Key"] = privateKeyFromHeader
    }

    const options: RequestInit = {
      method: method.toUpperCase(),
      headers,
    }

    if (method !== "GET" && data) {
      options.body = JSON.stringify(data)
    }

    console.log("[v0] Proxying request to:", url, "with headers:", Object.keys(headers))

    const response = await fetch(url, options)
    const text = await response.text()

    if (!response.ok) {
      console.error(`[v0] fetch to ${url} failed with status ${response.status} and body: ${text}`)
    }

    let jsonData = null
    if (text) {
      try {
        jsonData = JSON.parse(text)
      } catch {
        jsonData = { raw: text }
      }
    }

    return NextResponse.json(
      {
        status: response.status,
        ok: response.ok,
        data: jsonData,
        raw: !jsonData ? text : undefined,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Proxy error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Proxy error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
