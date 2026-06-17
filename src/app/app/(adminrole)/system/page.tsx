import { redirect } from "next/navigation";

export default function SystemIndexPage() {
  redirect("/app/system/users");

  return <></>;
}
