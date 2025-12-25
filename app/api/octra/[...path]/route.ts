import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_URL = "https://octra.network";

async function proxy(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const url = `${UPSTREAM_URL}/${path}${request.nextUrl.search}`;

  // console.log(`[Proxy] Forwarding ${request.method} to ${url}`);

  try {
    const body =
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.text()
        : undefined;

    const headers = new Headers();
    // Copy necessary headers, but avoid host/connection/content-length
    request.headers.forEach((value, key) => {
      if (
        !["host", "connection", "content-length", "transfer-encoding"].includes(
          key.toLowerCase()
        )
      ) {
        headers.set(key, value);
      }
    });

    // Enforce JSON if sending data
    if (body) {
      headers.set("Content-Type", "application/json");
    }

    // Set User-Agent to mimic a browser or standard client to avoid blocking
    headers.set("User-Agent", "OctraWallet/1.0");

    const response = await fetch(url, {
      method: request.method,
      headers: headers,
      body: body,
      cache: "no-store",
      // @ts-ignore - undici/node-fetch option for timeout
      signal: AbortSignal.timeout(10000),
    });

    const responseBody = await response.arrayBuffer();

    const responseHeaders = new Headers(response.headers);
    // CORS headers for the browser
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "*");

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("[Proxy Error]", error);
    return NextResponse.json(
      { error: "Proxy Failed", details: error.message },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const OPTIONS = async (request: NextRequest) => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Private-Key",
    },
  });
};
