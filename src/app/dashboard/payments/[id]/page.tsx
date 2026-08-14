import { redirect } from "next/navigation";

export default async function PaymentDetailsPage() {
  redirect("/dashboard/payments");
}
