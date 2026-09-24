"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const needsUsername = !data.user.user_metadata?.username;
  revalidatePath("/", "layout");
  return { success: true, needsUsername };
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({ 
    email, 
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true, needsUsername: true };
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function saveUsername(formData: FormData) {
  const supabase = await createClient();
  const username = formData.get("username") as string;
  
  if (!username || username.trim() === "") {
    return { error: "Username is required." };
  }

  const { error } = await supabase.auth.updateUser({
    data: { username: username.trim() }
  });

  if (error) {
    return { error: error.message };
  }
  
  revalidatePath("/", "layout");
  return { success: true };
}
