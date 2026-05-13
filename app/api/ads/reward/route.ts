import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userid');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userid' }, { status: 400 });
  }

  try {
    // 1. Fetch current resources
    const { data: resources, error: fetchError } = await supabase
      .from('user_resources')
      .select('*')
      .eq('telegram_id', userId)
      .single();

    if (fetchError || !resources) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Update resources (reward: 5 of each)
    const rewardAmount = 5;
    const { error: updateError } = await supabase
      .from('user_resources')
      .update({
        oil: (resources.oil || 0) + rewardAmount,
        gold: (resources.gold || 0) + rewardAmount,
        iron: (resources.iron || 0) + rewardAmount,
        wheat: (resources.wheat || 0) + rewardAmount,
      })
      .eq('telegram_id', userId);

    if (updateError) {
      throw updateError;
    }

    // 3. Log task completion
    await supabase
      .from('user_tasks')
      .upsert({
        telegram_id: userId,
        task_id: 'watch_ad',
        completed_at: new Date().toISOString()
      }, { onConflict: 'telegram_id,task_id' });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reward API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
