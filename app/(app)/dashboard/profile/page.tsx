import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-8">
        <p className="text-sm text-red-600">You must be signed in to view your profile.</p>
      </div>
    );
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Get email from auth
  const email = user.email || "";

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Profile</h1>
        <p className="text-gray-600">
          Update your contact information. This will be used in the header of your generated resumes.
        </p>
      </div>

      <ProfileForm
        initialData={{
          full_name: profile?.full_name || "",
          headline: profile?.headline || "",
          location: profile?.location || "",
          phone: profile?.phone || "",
          email: email,
          links: (profile?.links as Array<{ label: string; url: string }>) || [],
        }}
      />
    </div>
  );
}

