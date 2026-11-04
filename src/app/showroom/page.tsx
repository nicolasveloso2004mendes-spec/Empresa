import { redirect } from "next/navigation";
import { listProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ShowroomIndex() {
  const [first] = await listProducts();
  redirect(first ? `/showroom/${first.slug}` : "/produtos");
}
