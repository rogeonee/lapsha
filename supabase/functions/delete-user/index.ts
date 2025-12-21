// supabase/functions/delete-user/index.ts
// eslint-disable-next-line import/no-unresolved
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

type Json = Record<string, unknown>;

const jsonResponse = (body: Json, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const authHeader = req.headers.get('Authorization') || '';
    const supabaseUserClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify caller is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseUserClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Parse body
    const { userId } = (await req.json().catch(() => ({}))) as {
      userId?: string;
    };
    if (!userId) return jsonResponse({ error: 'userId required' }, 400);
    if (userId !== user.id) {
      return jsonResponse({ error: 'Cannot delete another user' }, 403);
    }

    // Service-role client for destructive ops
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Gather person ids for cascading deletes
    const { data: persons, error: personsError } = await supabaseAdmin
      .from('persons')
      .select('id')
      .eq('user_id', userId);
    if (personsError) {
      return jsonResponse({ error: personsError.message }, 500);
    }
    const personIds = (persons ?? []).map((p) => p.id);

    // Delete child rows first
    if (personIds.length > 0) {
      const [datesResult, factsResult] = await Promise.all([
        supabaseAdmin.from('dates').delete().in('person_id', personIds),
        supabaseAdmin.from('facts').delete().in('person_id', personIds),
      ]);
      const childError = datesResult.error || factsResult.error;
      if (childError) {
        return jsonResponse({ error: childError.message }, 500);
      }
    }

    // Delete persons
    const { error: personsDeleteError } = await supabaseAdmin
      .from('persons')
      .delete()
      .eq('user_id', userId);
    if (personsDeleteError) {
      return jsonResponse({ error: personsDeleteError.message }, 500);
    }

    // Delete user profile row
    const { error: userRowError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);
    if (userRowError) {
      return jsonResponse({ error: userRowError.message }, 500);
    }

    // Optional: delete storage objects owned by user
    // Example: await supabaseAdmin.storage.from('attachments').remove([`user/${userId}`]);

    // Delete auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId,
    );
    if (deleteError) {
      return jsonResponse({ error: deleteError.message }, 500);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('delete-user unexpected error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});