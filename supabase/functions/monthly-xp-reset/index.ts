import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting monthly XP reset...')

    // Get current month and year (we're resetting for the PREVIOUS month)
    const now = new Date()
    const previousMonth = now.getMonth() === 0 ? 12 : now.getMonth() // 1-12
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

    console.log(`Processing reset for month: ${previousMonth}, year: ${year}`)

    // 1. Get top 3 users by XP points
    const { data: topUsers, error: topUsersError } = await supabase
      .from('profiles')
      .select('user_id, full_name, xp_points')
      .order('xp_points', { ascending: false })
      .limit(3)

    if (topUsersError) {
      console.error('Error fetching top users:', topUsersError)
      throw topUsersError
    }

    console.log(`Found ${topUsers?.length || 0} top users`)

    // 2. Save top 3 to monthly_leaderboard_snapshots
    if (topUsers && topUsers.length > 0) {
      const snapshots = topUsers.map((user, index) => ({
        user_id: user.user_id,
        full_name: user.full_name,
        xp_points: user.xp_points,
        rank: index + 1,
        month: previousMonth,
        year: year,
      }))

      const { error: snapshotError } = await supabase
        .from('monthly_leaderboard_snapshots')
        .insert(snapshots)

      if (snapshotError) {
        console.error('Error inserting snapshots:', snapshotError)
        throw snapshotError
      }

      console.log(`Saved ${snapshots.length} leaderboard snapshots`)
    }

    // 3. Get all users with XP > 0 for transaction records
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, xp_points')
      .gt('xp_points', 0)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }

    // 4. Create monthly_reset transactions for all users with XP
    if (allProfiles && allProfiles.length > 0) {
      const transactions = allProfiles.map((profile) => ({
        user_id: profile.user_id,
        amount: -profile.xp_points, // Negative to show XP removed
        transaction_type: 'monthly_reset' as const,
        reason: `Monthly reset for ${getMonthName(previousMonth)} ${year}`,
      }))

      const { error: transactionError } = await supabase
        .from('xp_transactions')
        .insert(transactions)

      if (transactionError) {
        console.error('Error inserting transactions:', transactionError)
        throw transactionError
      }

      console.log(`Created ${transactions.length} reset transactions`)
    }

    // 5. Reset all users' XP points to 0
    const { error: resetError } = await supabase
      .from('profiles')
      .update({ xp_points: 0 })
      .gt('xp_points', 0)

    if (resetError) {
      console.error('Error resetting XP:', resetError)
      throw resetError
    }

    console.log('Monthly XP reset completed successfully!')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Monthly XP reset completed',
        topUsers: topUsers?.length || 0,
        usersReset: allProfiles?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Monthly XP reset failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month - 1] || 'Unknown'
}
