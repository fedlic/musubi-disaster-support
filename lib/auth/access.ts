import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const staffRoleLabels: Record<string, string> = {
  super_admin: "システム管理者",
  municipal_admin: "自治体管理者",
  coordinator: "支援調整責任者",
  dispatcher: "配車・割当担当",
  viewer: "閲覧担当",
};

export type StaffAccess = {
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
  membership: {
    id: string;
    role: string;
    title: string | null;
    organization_id: string;
    organizations: { id: string; name: string; slug: string } | null;
  } | null;
};

export async function getStaffAccess(): Promise<StaffAccess | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data: membership } = await supabase
    .from("staff_memberships")
    .select("id,role,title,organization_id,organizations(id,name,slug)")
    .eq("user_id", authData.user.id)
    .eq("is_active", true)
    .maybeSingle();

  return {
    user: authData.user,
    membership: membership
      ? {
          ...membership,
          organizations: Array.isArray(membership.organizations)
            ? membership.organizations[0] ?? null
            : membership.organizations,
        }
      : null,
  };
}
