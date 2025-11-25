# HabitBuddies 📱

A beautiful, real-time habit tracking Progressive Web App (PWA) for couples. Track daily habits together with automatic syncing and offline support.

## ✨ Features

- **Real-time Sync**: Changes sync instantly between devices when online
- **Offline Support**: Works without internet connection
- **PWA Ready**: Install as a native app on phones/tablets
- **Shared Tracking**: Perfect for couples to track habits together
- **Beautiful UI**: Clean, modern interface with smooth animations
- **Daily Email Summaries**: Automated daily progress reports (optional)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd HabitBuddies
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema in your Supabase SQL Editor:
     ```sql
     -- Create the daily_habits table
     CREATE TABLE daily_habits (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       date TEXT NOT NULL,
       habits JSONB NOT NULL,
       user_id TEXT NOT NULL DEFAULT 'shared',
       created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
     );

     -- Create an index on date and user_id for faster queries
     CREATE INDEX idx_daily_habits_date_user ON daily_habits(date, user_id);

     -- Enable Row Level Security (RLS)
     ALTER TABLE daily_habits ENABLE ROW LEVEL SECURITY;

     -- Create a policy that allows all operations for now
     CREATE POLICY "Allow all operations for shared user" ON daily_habits
       FOR ALL USING (user_id = 'shared');

     -- Create a function to automatically update the updated_at timestamp
     CREATE OR REPLACE FUNCTION update_updated_at_column()
     RETURNS TRIGGER AS $$
     BEGIN
       NEW.updated_at = TIMEZONE('utc'::text, NOW());
       RETURN NEW;
     END;
     $$ language 'plpgsql';

     -- Create a trigger to automatically update updated_at on row changes
     CREATE TRIGGER update_daily_habits_updated_at
       BEFORE UPDATE ON daily_habits
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column();
     ```

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Run the app**
   ```bash
   npx expo start --web
   ```

6. **Open in browser**
   Navigate to `http://localhost:8081` (or the port shown in terminal)

## 📱 Installation as PWA

1. Open the app in your browser
2. Click the browser menu (three dots)
3. Select "Add to Home Screen" or "Install App"
4. The app will be installed as a native app on your device

## 📧 Daily Email Summaries (Optional)

Get automated daily progress reports sent to your email.

### Setup Steps

1. **Sign up for Resend** (free tier available)
   - Go to [resend.com](https://resend.com)
   - Create an account and get your API key

2. **Deploy Edge Function**
   - Go to your Supabase Dashboard → Edge Functions
   - Create new function named `send-daily-summary`
   - Copy the code from `supabase/functions/send-daily-summary/index.ts`
   - Deploy the function

3. **Add Environment Variable**
   - Supabase Dashboard → Settings → Edge Functions
   - Add `RESEND_API_KEY` with your Resend API key

4. **Set up Daily Cron Job**
   - Use [cron-job.org](https://cron-job.org) (free)
   - Create new cron job:
     - URL: `https://your-project-ref.supabase.co/functions/v1/send-daily-summary`
     - Method: POST
     - Headers: `Authorization: Bearer your-anon-key`
     - Schedule: `0 5 * * *` (daily at 5:00 UTC = 2:00 AM Argentina time)

## 🛠️ Development

### Project Structure
```
HabitBuddies/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Home page
│   └── +not-found.tsx     # 404 page
├── constants/             # App constants
│   ├── colors.ts         # Color scheme
│   ├── defaultHabits.ts  # Default habit data
│   └── supabase.ts       # Supabase configuration
├── contexts/              # React contexts
│   └── HabitsContext.tsx # Main app state management
├── types/                 # TypeScript type definitions
│   └── habits.ts         # Habit-related types
├── supabase/              # Supabase Edge Functions
│   └── functions/
│       └── send-daily-summary/
└── dist/                  # Built PWA files (after expo export)
```

### Available Scripts

- `npx expo start` - Start development server
- `npx expo start --web` - Start web development server
- `npx expo export --platform web` - Build PWA for deployment
- `npx expo build:web` - Build optimized web bundle

## 🔧 Customization

### Adding New Habits
Edit `constants/defaultHabits.ts` to add new default habits.

### Changing Colors
Modify `constants/colors.ts` to update the app's color scheme.

### Email Template
Customize the email template in `supabase/functions/send-daily-summary/index.ts`.

## 🚀 Deployment

### Static Hosting
The app can be deployed to any static hosting service:

1. **Build the PWA**
   ```bash
   npx expo export --platform web
   ```

2. **Deploy the `dist/` folder** to:
   - Vercel
   - Netlify
   - Firebase Hosting
   - GitHub Pages
   - Any static host

### Environment Variables for Production
Make sure to set the Supabase environment variables in your hosting platform.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/)
- Real-time sync powered by [Supabase](https://supabase.com)
- Email service by [Resend](https://resend.com)
- Icons and styling inspired by modern design principles

---

**Happy habit tracking! 💪**
