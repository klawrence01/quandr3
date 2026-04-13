"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = "https://anzhnnffiutuvhvhmgpk.supabase.co";
const supabaseKey = "sb_publishable_6TRF658OzO7Vp_0U1PeaXQ_KDkcu5Jw";
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);