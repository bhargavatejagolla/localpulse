import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface NotificationPayload {
  issue_id: string;
  new_status: string;
  reporter_id: string;
}

serve(async (req: Request) => {
  try {
    const payload: NotificationPayload = await req.json();
    const { issue_id, new_status, reporter_id } = payload;

    // Get all users who upvoted this issue
    const { data: upvoters } = await supabase
      .from('upvotes')
      .select('user_id')
      .eq('issue_id', issue_id);

    // Collect unique user IDs (reporter + upvoters)
    const userIds = new Set<string>();
    if (reporter_id) userIds.add(reporter_id);
    upvoters?.forEach((u) => userIds.add(u.user_id));

    // Get push tokens for all users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, expo_push_token')
      .in('user_id', Array.from(userIds))
      .not('expo_push_token', 'is', null);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: 'No tokens found' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send push notifications
    const messages = profiles.map((profile) => ({
      to: profile.expo_push_token,
      sound: 'default',
      title: 'Issue Status Updated! 📢',
      body: `An issue you follow has been marked as "${new_status}"`,
      data: { issue_id },
    }));

    // Send via Expo Push API
    const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const pushResult = await pushResponse.json();

    // Store notifications in database
    const notificationInserts = Array.from(userIds).map((userId) => ({
      user_id: userId,
      issue_id,
      message: `Issue status updated to "${new_status}"`,
    }));

    await supabase.from('notifications').insert(notificationInserts);

    return new Response(JSON.stringify({ success: true, pushResult }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
