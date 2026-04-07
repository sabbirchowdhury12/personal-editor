import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  isPublic: z.boolean().optional(),
  categoryId: z.string().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!document.isPublic && document.userId !== session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(document);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.document.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, isPublic, categoryId } = updateSchema.parse(body);

    const document = await prisma.document.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(isPublic !== undefined && { isPublic }),
        ...(categoryId !== undefined && { 
          categoryId: categoryId || null,
          // Set order to end of category if assigning to a category
          ...(categoryId && { order: 0 }), // Simplified: you can enhance this
        }),
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.document.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.document.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
