"use server";

import { createClient } from "@supabase/supabase-js";
import { sendPushNotification } from "@/lib/pushNotification";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function subscribeUser(subscription, firebaseUId) {
  if (!firebaseUId) return { success: false, error: "User not authenticated" };

  //Get user_id using firebaseUId
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("firebase_uid", firebaseUId)
    .single();

  if (userError) {
    throw userError;
  }

  const { error } = await supabase.from("pwa_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint, // Endpoint is used as a unique key
      subscription_data: subscription,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    console.error("Error storing subscription:", error);
    return {
      success: false,
      error: `Supabase error: ${error.code} - ${error.message}`,
    };
  }
  console.log({ success: true, message: "user subscription successful" });
  return { success: true };
}

export async function unsubscribeUser(subscription) {
  const { error } = await supabase
    .from("pwa_subscriptions")
    .delete()
    .eq("endpoint", subscription.endpoint);

  if (error) {
    console.error("Error removing subscription:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function sendTestNotificationToUser(subscription, message) {
  if (!subscription) return { success: false, error: "No subscription found." };
  const payload = {
    title: "Test Notification",
    body: message,
    icon: "/icon.png",
  };
  return await sendPushNotification(subscription, payload);
}
