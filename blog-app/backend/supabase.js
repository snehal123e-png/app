const { createClient } = require("@supabase/supabase-js");

console.log("SUPABASE_URL =", process.env.SUPABASE_URL);
console.log("KEY EXISTS =", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;