import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const documentSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  isPublic: z.boolean().default(false),
  categoryId: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");

  const where: any = { userId: session.user.id };
  
  if (category) {
    where.categoryId = category;
  }
  
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
    ];
  }

  const documents = await prisma.document.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, isPublic, categoryId } = documentSchema.parse(body);

    const document = await prisma.document.create({
      data: {
        title,
        content,
        isPublic,
        userId: session.user.id,
        categoryId: categoryId || null,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
