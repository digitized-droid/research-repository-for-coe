const SUPABASE_URL = "https://vwzhzycagqqhcxbopjtc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3emh6eWNhZ3FxaGN4Ym9wanRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjI4NjEsImV4cCI6MjA5MDEzODg2MX0.KajiaXQecd-Icu6D9XUKViBsRn4bldVfwoFeamog8ww";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isLogin = true;

// ================= ELEMENTS =================
const authModal = document.getElementById("auth-modal");
const userInfo = document.getElementById("user-info");

// ================= SETTINGS DROPDOWN =================
const gear = document.getElementById("gearToggle");
const settingsDropdown = document.getElementById("settingsDropdown");

if (gear && settingsDropdown) {
  gear.addEventListener("click", (e) => {
    e.stopPropagation();
    settingsDropdown.style.display =
      settingsDropdown.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", (e) => {
    if (!gear.contains(e.target) && !settingsDropdown.contains(e.target)) {
      settingsDropdown.style.display = "none";
    }
  });
}

// ================= TOGGLE =================
function toggleMode() {
  isLogin = !isLogin;

  document.getElementById("auth-title").innerText = isLogin ? "Sign In" : "Sign Up";
  document.getElementById("toggle-text").innerText = isLogin ? "No account?" : "Already have one?";
  document.getElementById("toggle-link").innerText = isLogin ? "Sign Up" : "Sign In";

  document.getElementById("display_name").style.display = isLogin ? "none" : "block";
  document.getElementById("phone").style.display = isLogin ? "none" : "block";
}

document.getElementById("toggle-link")?.addEventListener("click", e => {
  e.preventDefault();
  toggleMode();
});

// ================= BUTTON STATE =================
function setButtonState(button, state) {
  button.disabled = state === "loading";
  button.textContent = state === "loading" ? "Processing..." : "Submit";
}

// ================= LOAD USER =================
async function loadUser(userId = null) {
  try {
    // Get session if no ID provided
    if (!userId) {
      const { data } = await supabaseClient.auth.getSession();
      userId = data?.session?.user?.id;
    }

    // Not logged in
    if (!userId) {
      if (userInfo) userInfo.textContent = "Not logged in";
      return;
    }

    // Fetch profile
    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      console.error("Profile error:", error);
      if (userInfo) userInfo.textContent = "Profile not found";
      return;
    }

    // ✅ Update UI
    if (authModal) authModal.style.display = "none";
    if (userInfo) {
      function toProperCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

if (userInfo) {
  const formattedName = profile.full_name
    ? toProperCase(profile.full_name)
    : "User";

  userInfo.textContent = `Hello, ${formattedName}`;
}

    }

  } catch (err) {
    console.error("Load user error:", err);
  }
}

// ================= LOGIN / SIGNUP =================
document.getElementById("auth-submit")?.addEventListener("click", async () => {
  const btn = document.getElementById("auth-submit");
  setButtonState(btn, "loading");

  try {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const student_number = document.getElementById("student_number").value.trim();

    if (!student_number.toLowerCase().startsWith('m')) {
      alert("Student number must start with M");
      setButtonState(btn, "normal");
      return;
    }

    if (isLogin) {
      // LOGIN
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

      if (error) {
        alert(error.message);
        setButtonState(btn, "normal");
        return;
      }

      const userId = data.user.id;

      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!profile || profile.student_number !== student_number) {
        await supabaseClient.auth.signOut();
        alert("Incorrect student number");
        setButtonState(btn, "normal");
        return;
      }

      await loadUser(userId);

    } else {
      // SIGNUP
      const full_name = document.getElementById("display_name").value.trim();
      const phone = document.getElementById("phone").value.trim();

      const { data, error } = await supabaseClient.auth.signUp({ email, password });

      if (error) {
        alert(error.message);
        setButtonState(btn, "normal");
        return;
      }

      if (data.user) {
        const { error: insertError } = await supabaseClient
          .from("profiles")
          .insert({
            id: data.user.id,
            email,
            student_number,
            full_name,
            phone,
            role: "user"
          });

        if (insertError) {
          console.error(insertError);
          alert("Failed to save profile");
          setButtonState(btn, "normal");
          return;
        }
      }

      alert("Account created! Check your email.");
    }

  } catch (err) {
    console.error(err);
    alert("Unexpected error");
  }

  setButtonState(btn, "normal");
});

// ================= LOGOUT =================
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
});

// ================= SETTINGS =================

// CHANGE NAME
document.getElementById("change-username-btn")?.addEventListener("click", async () => {
  const newUsername = document.getElementById("new-username").value.trim();
  if (!newUsername) return alert("Enter valid username");

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return alert("Not logged in");

  const { error } = await supabaseClient
    .from("profiles")
    .update({ full_name: newUsername })
    .eq("id", user.id);

  if (error) return alert(error.message);

  alert("Username updated!");
  loadUser(user.id);
});

// CHANGE EMAIL
document.getElementById("change-email-btn")?.addEventListener("click", async () => {
  const newEmail = document.getElementById("new-email").value.trim();
  if (!newEmail) return alert("Enter valid email");

  const { error } = await supabaseClient.auth.updateUser({ email: newEmail });
  if (error) return alert(error.message);

  alert("Check your new email to confirm.");
});

// CHANGE PHONE
document.getElementById("change-phone-btn")?.addEventListener("click", async () => {
  const val = document.getElementById("new-phone").value.trim();
  if (!val) return alert("Enter phone number");

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return alert("Not logged in");

  const { error } = await supabaseClient
    .from("profiles")
    .update({ phone: val })
    .eq("id", user.id);

  if (error) return alert(error.message);

  alert("Phone updated!");
});

// CHANGE PASSWORD
document.getElementById("change-password-btn")?.addEventListener("click", async () => {
  const newPassword = document.getElementById("new-password").value;
  if (newPassword.length < 6) return alert("Password must be at least 6 characters");

  const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
  if (error) return alert(error.message);

  alert("Password updated!");
});

// ================= AUTH STATE LISTENER =================
supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    loadUser(session.user.id);
  } else {
    if (userInfo) userInfo.textContent = "Not logged in";
  }
});

// ================= INITIAL LOAD =================
document.addEventListener("DOMContentLoaded", () => {
  loadUser();
});