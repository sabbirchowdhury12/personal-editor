import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const document = await prisma.document.findFirst({
    where: {
      OR: [
        { id, isPublic: true },
        { slug: id, isPublic: true },
      ],
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json(document);
}
