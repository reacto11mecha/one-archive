import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const auth = await getSession();

  if (auth) redirect("/app");

  return <>{children}</>;
}
