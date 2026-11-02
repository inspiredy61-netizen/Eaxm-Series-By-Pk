import { AlertTriangle } from "lucide-react";
import { isSupabaseConfigured } from "../lib/supabase";

export default function ConfigNotice() {
  if (isSupabaseConfigured) return null;
  return <div className="config-notice"><AlertTriangle size={18}/><div><b>Supabase setup required</b><p>Add your Supabase project URL and anon/publishable key to the <code>.env</code> file. Follow the README before using authentication or database features.</p></div></div>;
}
