import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

webpush.setVapidDetails(
  `mailto:${process.env.AUTHOR_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


export async function sendPushNotification(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    console.error("Error sending push notification:", error);
    // If a subscription is expired or invalid, it should be removed.
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log("Subscription expired or invalid. Removing...");
      await supabaseAdmin
        .from("pwa_subscriptions")
        .delete()
        .eq("endpoint", subscription.endpoint);
    }
    return { success: false, error: "Failed to send notification" };
  }
}

export async function getSubscriptionsForUser(userId) {
  const { data, error } = await supabaseAdmin
    .from("pwa_subscriptions")
    .select("subscription_data")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching subscriptions for user:", error);
    return [];
  }

  // Store subscription data in a JSONB column.
  return data.map(item => item.subscription_data);
}
