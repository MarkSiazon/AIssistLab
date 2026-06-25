import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/lib/routes/app-routes";

export default function Home() {
  redirect(APP_ROUTES.skills);
}
