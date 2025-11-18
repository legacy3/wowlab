import { atom } from "jotai";
import { createClient } from "@/lib/supabase/client";

export const supabaseClientAtom = atom(() => createClient());
