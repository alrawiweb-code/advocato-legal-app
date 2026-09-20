import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConsultationWorkspacePage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    redirect("/messages");
  }
  // If it's a UUID, pass as matterId; otherwise pass as id
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  redirect(isUuid ? `/messages?matterId=${id}` : `/messages?id=${id}`);
}
