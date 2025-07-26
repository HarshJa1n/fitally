"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/database";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/login?error=Authentication failed');
          return;
        }

        if (data.session?.user) {
          // Check if user has a profile (indicates completed onboarding)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, onboarding_completed')
            .eq('id', data.session.user.id)
            .single();

          // If no profile exists or onboarding is not complete, redirect to onboarding
          if (profileError || !profile || profile.onboarding_completed === false) {
            router.push('/onboarding');
          } else {
            router.push('/');
          }
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        router.push('/login?error=Something went wrong');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
} 