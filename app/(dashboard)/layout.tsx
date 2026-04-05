import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  });

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex">
      <Sidebar documents={documents} categories={categories} />
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
