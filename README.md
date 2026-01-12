# Might - AI-Powered Productivity Tracker

A minimalist productivity tracking app that uses AI to intelligently categorize your activities, automatically track goals, and celebrate your achievements.

## ✨ Features

### 🤖 Natural Language AI Entry
Type "went to gym for 2 hours" - AI extracts everything and categorizes automatically. No forms, just plain English.

### ⚡ Intelligent Quick-Add Suggestions
One-tap suggestions for frequent activities, pre-filled with your usual duration. Appears at the times you normally do them.

### 📊 Productivity Heatmap Calendar
GitHub-style yearly calendar color-coded by productivity. See patterns and streaks instantly. Gamifies consistency.

### 📝 AI-Powered Weekly Summaries
Personalized, encouraging narratives celebrating your wins every week. Not stats—actual prose that makes you proud.

### 🎯 Automatic Goal Progress Tracking
Set goals once, AI updates them automatically from your entries. Zero manual tracking needed.

### ⏰ Context-Aware Time Utilization
Shows "3h of 112 waking hours (2.7%)" not just "3 hours." Makes you aware of actual potential.

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Backend:** Supabase (Authentication + PostgreSQL)
- **AI:** OpenAI GPT-5 Nano API
- **Icons:** Lucide React
- **Charts:** Recharts
- **Routing:** React Router DOM

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/Ahd4wnn/Might-Productivity.git
cd might
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

4. Set up Supabase database

Run the following SQL in your Supabase SQL Editor:
```sql
-- Categories table
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text default '#6B7280',
  user_id uuid references auth.users(id) not null,
  created_at timestamp default now(),
  unique(name, user_id)
);

-- Entries table
create table entries (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  activity text not null,
  category_id uuid references categories(id),
  duration_minutes integer,
  sentiment text,
  timestamp timestamp default now(),
  edited boolean default false,
  user_id uuid references auth.users(id) not null
);

-- Pending categories table
create table pending_categories (
  id uuid primary key default gen_random_uuid(),
  suggested_name text not null,
  entry_id uuid references entries(id),
  reason text,
  created_at timestamp default now(),
  status text default 'pending',
  user_id uuid references auth.users(id) not null
);

-- Goals table
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  category_id uuid references categories(id),
  target_type text not null,
  target_value integer not null,
  current_value integer default 0,
  time_period text not null,
  status text default 'active',
  keywords text[],
  start_date timestamp default now(),
  end_date timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Goal progress table
create table goal_progress (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals(id) on delete cascade,
  entry_id uuid references entries(id) on delete cascade,
  value_added integer not null,
  recorded_at timestamp default now()
);

-- Weekly summaries table
create table weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  week_start date not null,
  week_end date not null,
  total_minutes integer,
  total_entries integer,
  active_days integer,
  top_category text,
  ai_summary text,
  stats jsonb,
  created_at timestamp default now()
);

-- Enable Row Level Security
alter table categories enable row level security;
alter table entries enable row level security;
alter table pending_categories enable row level security;
alter table goals enable row level security;
alter table goal_progress enable row level security;
alter table weekly_summaries enable row level security;

-- RLS Policies for categories
create policy "Users can view their own categories"
  on categories for select using (auth.uid() = user_id);
create policy "Users can insert their own categories"
  on categories for insert with check (auth.uid() = user_id);
create policy "Users can update their own categories"
  on categories for update using (auth.uid() = user_id);
create policy "Users can delete their own categories"
  on categories for delete using (auth.uid() = user_id);

-- RLS Policies for entries
create policy "Users can view their own entries"
  on entries for select using (auth.uid() = user_id);
create policy "Users can insert their own entries"
  on entries for insert with check (auth.uid() = user_id);
create policy "Users can update their own entries"
  on entries for update using (auth.uid() = user_id);
create policy "Users can delete their own entries"
  on entries for delete using (auth.uid() = user_id);

-- RLS Policies for pending_categories
create policy "Users can view their own pending categories"
  on pending_categories for select using (auth.uid() = user_id);
create policy "Users can insert their own pending categories"
  on pending_categories for insert with check (auth.uid() = user_id);
create policy "Users can update their own pending categories"
  on pending_categories for update using (auth.uid() = user_id);

-- RLS Policies for goals
create policy "Users can view their own goals"
  on goals for select using (auth.uid() = user_id);
create policy "Users can insert their own goals"
  on goals for insert with check (auth.uid() = user_id);
create policy "Users can update their own goals"
  on goals for update using (auth.uid() = user_id);
create policy "Users can delete their own goals"
  on goals for delete using (auth.uid() = user_id);

-- RLS Policies for goal_progress
create policy "Users can view their own goal progress"
  on goal_progress for select
  using (goal_id in (select id from goals where user_id = auth.uid()));
create policy "Users can insert their own goal progress"
  on goal_progress for insert
  with check (goal_id in (select id from goals where user_id = auth.uid()));

-- RLS Policies for weekly_summaries
create policy "Users can view their own summaries"
  on weekly_summaries for select using (auth.uid() = user_id);
create policy "Users can insert their own summaries"
  on weekly_summaries for insert with check (auth.uid() = user_id);

-- Function to create default categories for new users
create or replace function create_default_categories()
returns trigger as $$
begin
  insert into categories (name, color, user_id) values
    ('Fitness', '#007AFF', new.id),
    ('Learning', '#AF52DE', new.id),
    ('Reading', '#FF9500', new.id),
    ('Work', '#6B7280', new.id),
    ('Health', '#FF3B30', new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create default categories on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure create_default_categories();
```

5. Enable Email Authentication in Supabase
   - Go to Authentication > Providers
   - Enable Email provider

6. Start the development server
```bash
npm run dev
```

7. Open [http://localhost:5173](http://localhost:5173) in your browser

## 📁 Project Structure
```
might/
├── src/
│   ├── components/       # React components
│   ├── context/          # Auth context
│   ├── lib/              # Supabase client
│   ├── pages/            # Page components
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
├── public/               # Static assets
├── .env.example          # Environment variables template
└── package.json          # Dependencies
```

## 🎨 Design Philosophy

Might follows a minimalist design approach inspired by Linear, Notion, and Apple's design language:

- Clean, spacious interfaces with generous whitespace
- Subtle borders and shadows (no heavy effects)
- Black/white/gray color palette with green for productivity indicators
- Smooth transitions and micro-interactions
- Mobile-first responsive design

## 🤖 AI Integration

### Entry Parsing
GPT-5 Nano extracts activity, duration, and sentiment from natural language input.

### Category Matching
AI semantically matches activities to existing categories or suggests new ones with reasoning.

### Goal Tracking
Automatically detects when entries contribute to active goals using keywords and semantic understanding.

### Weekly Summaries
Generates personalized, encouraging narratives that celebrate user achievements.

## 🔒 Security

- Row Level Security (RLS) policies ensure users can only access their own data
- Authentication handled by Supabase Auth
- API keys stored in environment variables
- All database queries are authenticated

## 🚧 Roadmap

- [ ] Mobile app (React Native)
- [ ] Dark mode
- [ ] Export data as CSV/PDF
- [ ] Social sharing for weekly summaries
- [ ] Integration with calendar apps
- [ ] Advanced analytics and insights
- [ ] Pomodoro timer integration
- [ ] Team/workspace features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/Ahd4wnn)
- LinkedIn: [Your LinkedIn](https://www.linkedin.com/in/adon-joseph-867a8b377/)

## 🙏 Acknowledgments

- OpenAI for GPT-5 Nano API
- Supabase for backend infrastructure
- The open-source community

## 📧 Contact

For questions or feedback, reach out at your.email@example.com

---

Built with ❤️ using AI-powered development tools
