import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      documents: {
        where: { isPublic: true },
        select: { id: true, slug: true, title: true },
        orderBy: { order: "asc" },
      },
    },
  });

  return NextResponse.json(categories);
}
