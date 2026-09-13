import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConsultationWorkspacePage({ params }: PageProps) {
  const resolvedParams = await params;
  redirect(resolvedParams?.id ? `/messages?id=${resolvedParams.id}` : "/messages");
}
