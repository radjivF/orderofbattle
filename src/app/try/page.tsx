import { redirect } from "next/navigation";

/** Old landing URL. Keep working bookmarks. */
export default function TryRedirect() {
  redirect("/");
}
