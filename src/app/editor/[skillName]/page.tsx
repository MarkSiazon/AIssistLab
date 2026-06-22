import { EditSkillPageClient } from "@/components/editor/EditSkillPageClient";

export default async function EditSkillPage({
  params,
}: {
  params: Promise<{ skillName: string }>;
}) {
  const { skillName } = await params;
  return <EditSkillPageClient skillName={skillName} />;
}
