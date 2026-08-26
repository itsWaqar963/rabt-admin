"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

async function adminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { supabase: null, user: null, error: "Not signed in" as const };
  }
  return { supabase, user, error: null };
}

export async function setProfileBanned(
  userId: string,
  banned: boolean,
): Promise<ActionResult> {
  const { supabase, error: authErr } = await adminClient();
  if (!supabase) return { ok: false, error: authErr ?? "Not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: banned })
    .eq("id", userId);

  if (error) {
    return {
      ok: false,
      error:
        error.message.includes("is_banned") || error.code === "PGRST204"
          ? "Ban requires migration 014 (is_banned + admin update policy). Apply SQL then retry."
          : error.message,
    };
  }
  revalidatePath("/dashboard/users");
  return { ok: true };
}

export async function promoteAdmin(userId: string): Promise<ActionResult> {
  const { supabase, error: authErr } = await adminClient();
  if (!supabase) return { ok: false, error: authErr ?? "Not signed in" };

  const { error } = await supabase.from("admin_users").insert({
    user_id: userId,
    role: "admin",
  });

  if (error) {
    return {
      ok: false,
      error: error.message.includes("policy")
        ? "Promote requires migration 014 (admin_users insert policy). Apply SQL then retry."
        : error.message,
    };
  }
  revalidatePath("/dashboard/users");
  return { ok: true };
}

export async function demoteAdmin(userId: string): Promise<ActionResult> {
  const { supabase, user, error: authErr } = await adminClient();
  if (!supabase || !user) {
    return { ok: false, error: authErr ?? "Not signed in" };
  }
  if (user.id === userId) {
    return { ok: false, error: "Cannot demote yourself" };
  }

  const { error } = await supabase
    .from("admin_users")
    .delete()
    .eq("user_id", userId);

  if (error) {
    return {
      ok: false,
      error: error.message.includes("policy")
        ? "Demote requires migration 014 (admin_users delete policy). Apply SQL then retry."
        : error.message,
    };
  }
  revalidatePath("/dashboard/users");
  return { ok: true };
}

export async function deleteMeetup(meetupId: string): Promise<ActionResult> {
  const { supabase, error: authErr } = await adminClient();
  if (!supabase) return { ok: false, error: authErr ?? "Not signed in" };

  const { error } = await supabase.from("meetups").delete().eq("id", meetupId);

  if (error) {
    return {
      ok: false,
      error: error.message.includes("policy")
        ? "Delete meetup requires migration 014 (admin delete policy). Apply SQL then retry."
        : error.message,
    };
  }
  revalidatePath("/dashboard/meetups");
  return { ok: true };
}

export async function dismissReport(
  kind: "user" | "meetup",
  reportId: string,
): Promise<ActionResult> {
  const { supabase, error: authErr } = await adminClient();
  if (!supabase) return { ok: false, error: authErr ?? "Not signed in" };

  let error: { message: string } | null = null;
  switch (kind) {
    case "user": {
      const res = await supabase
        .from("user_reports")
        .delete()
        .eq("id", reportId);
      error = res.error;
      break;
    }
    case "meetup": {
      const res = await supabase
        .from("meetup_reports")
        .delete()
        .eq("id", reportId);
      error = res.error;
      break;
    }
    default: {
      const _exhaustive: never = kind;
      return { ok: false, error: `Unknown kind: ${_exhaustive}` };
    }
  }

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/dashboard/reports");
  return { ok: true };
}

export async function reviewLesson(
  submissionId: string,
  status: "approved" | "rejected",
): Promise<ActionResult> {
  const { supabase, user, error: authErr } = await adminClient();
  if (!supabase || !user) {
    return { ok: false, error: authErr ?? "Not signed in" };
  }

  switch (status) {
    case "approved":
    case "rejected":
      break;
    default: {
      const _exhaustive: never = status;
      return { ok: false, error: `Unknown status: ${_exhaustive}` };
    }
  }

  const { error } = await supabase
    .from("lesson_submissions")
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/dashboard/lessons");
  return { ok: true };
}
