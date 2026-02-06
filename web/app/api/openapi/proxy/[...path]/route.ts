import { NextRequest, NextResponse } from "next/server";

function getApiBaseUrl() {
  const value = process.env.INACTU_API_BASE_URL ?? process.env.NEXT_PUBLIC_INACTU_API_BASE_URL;
  return value?.replace(/\/$/, "");
}

async function proxyRequest(request: NextRequest, method: string, path: string[]) {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json(
      { error: "API base URL not configured", details: "Set INACTU_API_BASE_URL or NEXT_PUBLIC_INACTU_API_BASE_URL." },
      { status: 500 }
    );
  }

  const upstreamUrl = new URL(`${apiBase}/${path.join("/")}`);
  upstreamUrl.search = request.nextUrl.search;

  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.delete("host");
  upstreamHeaders.delete("content-length");

  const hasBody = !["GET", "HEAD"].includes(method);
  const upstreamResponse = await fetch(upstreamUrl, {
    method,
    headers: upstreamHeaders,
    body: hasBody ? request.body : undefined,
    duplex: hasBody ? "half" : undefined
  } as RequestInit);

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("connection");

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders
  });
}

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return proxyRequest(request, "GET", path);
}

export async function POST(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return proxyRequest(request, "POST", path);
}

export async function PUT(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return proxyRequest(request, "PUT", path);
}

export async function PATCH(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return proxyRequest(request, "PATCH", path);
}

export async function DELETE(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return proxyRequest(request, "DELETE", path);
}

export async function HEAD(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return proxyRequest(request, "HEAD", path);
}

export async function OPTIONS(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return proxyRequest(request, "OPTIONS", path);
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
