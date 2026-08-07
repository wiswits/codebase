import { redirect } from "next/navigation";

/**
 * This repository contains Jatin's standalone HR-PMS frontend contribution.
 * The root of the app redirects straight into the PMS module. When this is
 * integrated into the real WisWits app shell, this route (and this file)
 * should be replaced by the host application's own landing page.
 */
export default function RootPage() {
  redirect("/hr/pms");
}
