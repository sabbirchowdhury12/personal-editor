import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { slugify } from "@/lib/slugify";

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
  const all = searchParams.get("all") === "true";

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

  const orderBy = all 
    ? { order: "asc" as const }
    : { updatedAt: "desc" as const };

  const documents = await prisma.document.findMany({
    where,
    include: {
      category: {
        select: { id: true, name: true, order: true },
      },
    },
    orderBy,
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
    const slug = slugify(title);

    const maxOrder = categoryId ? await prisma.document.findFirst({
      where: { categoryId },
      orderBy: { order: "desc" },
      select: { order: true },
    }) : null;

    const document = await prisma.document.create({
      data: {
        title,
        slug,
        content,
        isPublic,
        userId: session.user.id,
        categoryId: categoryId || null,
        order: (maxOrder?.order ?? -1) + 1,
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

export async function PUT(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, categoryId } = z.object({
      ids: z.array(z.string()),
      categoryId: z.string().optional(),
    }).parse(body);

    const userId = session.user.id;

    if (categoryId) {
      await prisma.$transaction(
        ids.map((id: string, index: number) =>
          prisma.document.updateMany({
            where: { id, userId },
            data: { order: index },
          })
        )
      );
    } else {
      await prisma.$transaction(
        ids.map((id: string, index: number) =>
          prisma.document.update({
            where: { id },
            data: { order: index },
          })
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}