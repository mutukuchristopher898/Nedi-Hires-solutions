import { redirect } from "next/navigation";

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/booking/${id}/trip`);
}
