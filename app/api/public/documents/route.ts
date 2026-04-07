import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const categorySlug = searchParams.get("categorySlug");

  const where: any = { isPublic: true };
  
  if (categoryId) {
    where.categoryId = categoryId;
  } else if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  const documents = await prisma.document.findMany({
    where,
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(documents);
}
