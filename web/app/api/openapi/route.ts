import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const specPath = path.resolve(process.cwd(), "..", "openapi.yaml");
    const spec = await fs.readFile(specPath, "utf8");

    return new NextResponse(spec, {
      headers: {
        "content-type": "application/yaml; charset=utf-8",
        "cache-control": "public, max-age=60"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load OpenAPI spec", details: (error as Error).message },
      { status: 500 }
    );
  }
}
