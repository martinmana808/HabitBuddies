import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Habit {
  id: string;
  name: string;
  person: 'martin' | 'elise' | 'both';
  completed: {
    martin: boolean;
    elise: boolean;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get yesterday's date (since this runs at 2am for the previous day)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

    // Fetch yesterday's habits
    const { data: habitsData, error } = await supabaseClient
      .from('daily_habits')
      .select('habits')
      .eq('date', dateKey)
      .eq('user_id', 'shared')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    const habits: Habit[] = habitsData?.habits || []

    // Calculate statistics
    const martinHabits = habits.filter(h => h.person === 'martin' || h.person === 'both')
    const eliseHabits = habits.filter(h => h.person === 'elise' || h.person === 'both')

    const martinCompleted = martinHabits.filter(h => h.completed.martin).length
    const eliseCompleted = eliseHabits.filter(h => h.completed.elise).length

    const martinPercentage = martinHabits.length > 0 ? Math.round((martinCompleted / martinHabits.length) * 100) : 0
    const elisePercentage = eliseHabits.length > 0 ? Math.round((eliseCompleted / eliseHabits.length) * 100) : 0

    // Generate email content
    const subject = `HabitBuddies results for ${dateKey}`

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; flex: 1; margin: 0 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .percentage { font-size: 2em; font-weight: bold; color: #667eea; }
    .habits-list { margin: 20px 0; }
    .habit { padding: 8px 0; border-bottom: 1px solid #eee; }
    .completed { color: #28a745; }
    .pending { color: #dc3545; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 HabitBuddies Daily Summary</h1>
      <p>${dateKey}</p>
    </div>
    <div class="content">
      <div class="stats">
        <div class="stat-card">
          <h3>Martin</h3>
          <div class="percentage">${martinPercentage}%</div>
          <p>${martinCompleted}/${martinHabits.length} habits completed</p>
        </div>
        <div class="stat-card">
          <h3>Elise</h3>
          <div class="percentage">${elisePercentage}%</div>
          <p>${eliseCompleted}/${eliseHabits.length} habits completed</p>
        </div>
      </div>

      <div class="habits-list">
        <h3>📝 Habit Details</h3>
        ${habits.map(habit => `
          <div class="habit">
            <strong>${habit.name}</strong>
            <div style="margin-top: 5px;">
              ${habit.person === 'both' || habit.person === 'martin' ?
                `<span class="${habit.completed.martin ? 'completed' : 'pending'}">Martin: ${habit.completed.martin ? '✅' : '❌'}</span>` : ''}
              ${habit.person === 'both' || habit.person === 'elise' ?
                `<span class="${habit.completed.elise ? 'completed' : 'pending'}" style="margin-left: 15px;">Elise: ${habit.completed.elise ? '✅' : '❌'}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>

      <p style="text-align: center; margin-top: 30px; color: #666;">
        Keep up the great work! 💪
      </p>
    </div>
  </div>
</body>
</html>`

    // Send emails using Resend (you'll need to set up Resend API key)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const emails = ['martinmana808@gmail.com', 'elisebrown7766@gmail.com']

    for (const email of emails) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'HabitBuddies <noreply@resend.dev>', // Replace with your verified domain
          to: [email],
          subject: subject,
          html: emailBody,
        }),
      })

      if (!emailResponse.ok) {
        console.error(`Failed to send email to ${email}:`, await emailResponse.text())
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error sending daily summary:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
