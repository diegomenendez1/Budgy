
import { createClient } from '@supabase/supabase-js';

// Hardcoded keys from lib/supabase.ts (for testing purposes)
const url = 'https://yvahpmjytjsbflauixga.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWhwbWp5dGpzYmZsYXVpeGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MDc5MTAsImV4cCI6MjA4Mjk4MzkxMH0.5_6kT41Ybr9oTIftUyOQfQ_4Si-wXoWlagGBtSQiXA0';

const supabase = createClient(url, key);

async function runSecurityTest() {
    console.log("🔒 Starting Security & RLS Check...");
    console.log("-----------------------------------");

    // TEST 1: Anonymous Read Access
    // An unauthenticated user (Anon) should NOT be able to see any transactions.
    console.log("\n[TEST 1] Attempting Anonymous Read (Attacker with no session)...");
    const { data: readData, error: readError } = await supabase
        .from('transactions')
        .select('*')
        .limit(5);

    if (readError) {
        console.log("✅ Read Blocked with Error:", readError.message);
    } else if (readData && readData.length === 0) {
        console.log("✅ Read Returned Empty (RLS Active, no public data leaked).");
    } else {
        console.error("❌ CRITICAL FAIL: Anonymous user read data!", readData);
    }

    // TEST 2: Anonymous Write Access
    // An unauthenticated user should NOT be able to insert data.
    console.log("\n[TEST 2] Attempting Anonymous Write (Injection Attack)...");
    const fakeTx = {
        amount: 999999,
        description: "HACKED_BY_ANON",
        date: new Date().toISOString(),
        type: "EXPENSE",
        category: "HACK",
        // owner_id: 'some-uuid' // Usually cant set this if RLS defaults to auth.uid()
    };

    const { data: writeData, error: writeError } = await supabase
        .from('transactions')
        .insert([fakeTx])
        .select();

    if (writeError) {
        console.log("✅ Write Blocked with Error:", writeError.message);
    } else {
        console.error("❌ CRITICAL FAIL: Anonymous user inserted data!", writeData);
    }

    // Summary
    console.log("\n-----------------------------------");
    console.log("Security Check Finished.");
}

runSecurityTest();
