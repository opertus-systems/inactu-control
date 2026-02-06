import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../../../lib/auth";
import { controlApiFetch } from "../../../../../../../lib/control-api";

type RouteParams = {
  params: Promise<{
    package: string;
    version: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { package: packageParam, version: versionParam } = await params;
  const packageName = encodeURIComponent(packageParam);
  const version = encodeURIComponent(versionParam);
  const response = await controlApiFetch(
    `/v1/packages/${packageName}/versions/${version}/deprecate`,
    session.user.id,
    { method: "POST" }
  );
  const payload = await response.json().catch(() => ({ error: "Unexpected response" }));
  return NextResponse.json(payload, { status: response.status });
}
