import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      documents: {
        where: { isPublic: true },
        select: { id: true, slug: true, title: true },
      },
    },
  });

  return NextResponse.json(categories);
}
