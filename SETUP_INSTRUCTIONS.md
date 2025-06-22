# Fitally Authentication Setup Instructions

## 🚀 **You're Almost Ready to Login!**

Your authentication system is fully built and ready to go. You just need to set up your Supabase credentials to get everything working.

---

## 📋 **Required Setup Steps**

### 1. **Set Up Supabase Project**

If you haven't already:
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to initialize (takes 1-2 minutes)

### 2. **Get Your Supabase Credentials**

From your Supabase dashboard:
1. Go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://your-project-ref.supabase.co`)
   - **Anon/Public Key** (long string starting with `eyJ...`)

### 3. **Create Environment Variables File**

Create a file called `.env.local` in the `fitally/` directory:

```bash
cd fitally
touch .env.local
```

Then add your credentials to `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. **Set Up Database Schema**

Your database schema is already defined in `supabase-schema.sql`. To apply it:

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql`
3. Paste it in the SQL Editor and run it
4. This will create all the necessary tables and relationships

### 5. **Configure Authentication Providers (Optional)**

For social login to work, configure OAuth providers in Supabase:

**For Google Authentication:**
1. Go to **Authentication** → **Providers** in Supabase
2. Enable **Google** provider
3. Add your Google OAuth credentials

**For GitHub Authentication:**
1. Enable **GitHub** provider
2. Add your GitHub OAuth app credentials

---

## 🧪 **Testing Your Setup**

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test the authentication flow:**
   - Visit `http://localhost:3000`
   - You should be redirected to `/login`
   - Try creating a new account
   - Complete the onboarding process
   - You should land on your dashboard with real data!

---

## 🎯 **Authentication Features Available**

### ✅ **Login & Registration**
- Email/password authentication
- Social login (Google, GitHub) - *if configured*
- Account creation with validation
- Beautiful, responsive design

### ✅ **Onboarding Flow**
- User profile creation
- Physical stats collection
- Automatic database setup
- Seamless redirect to dashboard

### ✅ **Password Management**
- Forgot password functionality
- Email-based password reset
- Secure password handling

### ✅ **User Experience**
- Smooth authentication flow
- Loading states and error handling
- Mobile-responsive design
- Professional UI/UX

---

## 🔍 **What Happens When You Login**

1. **Authentication Check** - Verifies your credentials
2. **Profile Check** - Checks if onboarding is complete
3. **Onboarding** - If not complete, guides you through profile setup
4. **Dashboard Access** - Redirects to your personalized dashboard with real data

---

## 🛠️ **Troubleshooting**

### **Environment Variables Not Loading**
- Ensure `.env.local` is in the `fitally/` directory (not the root)
- Restart the development server after adding environment variables
- Check that variable names start with `NEXT_PUBLIC_`

### **Database Connection Issues**
- Verify your Supabase URL and API key are correct
- Make sure you've run the schema SQL in your Supabase dashboard
- Check your Supabase project is active and not paused

### **Authentication Not Working**
- Clear your browser cache and local storage
- Check the browser console for error messages
- Verify your Supabase project settings allow signups

---

## 🎉 **You're All Set!**

Once you've completed these steps, you'll have a fully functional authentication system with:
- Secure user registration and login
- Professional onboarding experience  
- Real-time dashboard with your health data
- Complete user profile management

**Ready to login and start tracking your health with AI? Let's go! 🚀** 