import { getSession } from "~/server/better-auth/server";
import { redirect } from "next/navigation";
import * as schema from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";

export default async function AdminRoleOnlyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const currentUserData = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
    with: {
      role: true,
    },
  });

  if (!currentUserData?.role?.isAdmin) {
    redirect("/app/dashboard");
  }

  return <>{children}</>;
}
