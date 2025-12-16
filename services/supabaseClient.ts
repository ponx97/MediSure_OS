import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fuyahhxfzhlkiocugcuy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1eWFoaHhmemhsa2lvY3VnY3V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTg0ODQsImV4cCI6MjA4MTAzNDQ4NH0.EyfeqF41nympZ4dNfBPVr-I3P2Ma_QRdc2Yfpbz_Utc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
