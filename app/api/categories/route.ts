import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { slugify } from "@/lib/slugify";

const categorySchema = z.object({
  name: z.string().min(1),
});

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeDocs = searchParams.get("includeDocs") === "true";

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    ...(includeDocs && {
      include: {
        documents: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true },
        },
      },
    }),
  });

  if (includeDocs) {
    const docsByCat = categories as any;
    const documentsByCategory = new Map<string, { id: string; name: string; order: number }[]>();
    docsByCat.forEach((cat: any) => {
      documentsByCategory.set(cat.id, cat.documents);
    });
    return NextResponse.json({ categories, documentsByCategory });
  }

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = categorySchema.parse(body);
    const slug = slugify(name);

    const maxOrder = await prisma.category.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const order = (maxOrder?.order ?? -1) + 1;

    const category = await prisma.category.create({
      data: { name, slug, order },
    });

    return NextResponse.json(category);
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
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(body);

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.category.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Category ID required" }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Category ID required" }, { status: 400 });
    }

    const body = await request.json();
    const { name } = z.object({ name: z.string().min(1) }).parse(body);
    const slug = slugify(name);

    const category = await prisma.category.update({
      where: { id },
      data: { name, slug },
    });

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}