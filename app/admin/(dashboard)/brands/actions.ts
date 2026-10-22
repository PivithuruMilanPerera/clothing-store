"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Result = { success: boolean; error?: string };

function revalidateBrandPaths() {
  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}

export async function createBrandAction(name: string): Promise<Result> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Brand name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("brands").insert({ name: trimmed });

  if (error) {
    return {
      success: false,
      error: error.code === "23505" ? "This brand already exists." : error.message,
    };
  }

  revalidateBrandPaths();
  return { success: true };
}

export async function renameBrandAction(id: string, name: string): Promise<Result> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Brand name is required." };

  const supabase = await createClient();
  const { data: brand, error: loadError } = await supabase
    .from("brands")
    .select("name")
    .eq("id", id)
    .single();

  if (loadError || !brand) return { success: false, error: "Brand not found." };

  const { error } = await supabase.from("brands").update({ name: trimmed }).eq("id", id);
  if (error) {
    return {
      success: false,
      error: error.code === "23505" ? "Another brand already uses this name." : error.message,
    };
  }

  if (brand.name !== trimmed) {
    const { error: productsError } = await supabase
      .from("products")
      .update({ brand: trimmed, updated_at: new Date().toISOString() })
      .eq("brand", brand.name);

    if (productsError) {
      return {
        success: false,
        error: `Brand renamed, but products could not be updated: ${productsError.message}`,
      };
    }
  }

  revalidateBrandPaths();
  return { success: true };
}

export async function deleteBrandAction(id: string): Promise<Result> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: brand } = await supabase.from("brands").select("name").eq("id", id).single();
  if (!brand) return { success: false, error: "Brand not found." };

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("brand", brand.name);

  if ((count ?? 0) > 0) {
    return {
      success: false,
      error: `${count} product${count === 1 ? " uses" : "s use"} this brand. Reassign them first.`,
    };
  }

  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidateBrandPaths();
  return { success: true };
}
