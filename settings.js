function initSettings() {
  const gear = document.getElementById("gearToggle");
  const dropdown = document.getElementById("settingsDropdown");

  if (!gear || !dropdown) {
    console.warn("Settings UI not found");
    return;
  }

  // TOGGLE DROPDOWN
  gear.addEventListener("click", () => {
    dropdown.style.display =
      dropdown.style.display === "block" ? "none" : "block";
  });

  // CLICK OUTSIDE CLOSE
  document.addEventListener("click", e => {
    if (!gear.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });

  // LOGOUT
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "index.html";
    });
  }

  // CHANGE EMAIL
  const emailBtn = document.getElementById("change-email-btn");

if (emailBtn) {
  emailBtn.addEventListener("click", async () => {
    const val = document.getElementById("new-email").value.trim();
    if (!val) return alert("Enter email");

    const { data, error } = await supabaseClient.auth.updateUser({
      email: val
    });

    if (error) return alert(error.message);

    const { data: { user } } = await supabaseClient.auth.getUser();

    await supabaseClient
      .from("profiles")
      .update({ email: val })
      .eq("id", user.id);

    alert("Check your email to confirm.");
  });
}

const phoneBtn = document.getElementById("change-phone-btn");

if (phoneBtn) {
  phoneBtn.addEventListener("click", async () => {
    const val = document.getElementById("new-phone").value.trim();
    if (!val) return alert("Enter phone number");

    const { data: { user } } = await supabaseClient.auth.getUser();

    const { error } = await supabaseClient
      .from("profiles")
      .update({ phone: val })
      .eq("id", user.id);

    if (error) return alert(error.message);

    alert("Phone updated!");
  });
}

  // CHANGE PASSWORD
  const passBtn = document.getElementById("change-password-btn");
  if (passBtn) {
    passBtn.addEventListener("click", async () => {
      const val = document.getElementById("new-password").value;

      if (val.length < 6) return alert("Password too short");

      const { error } = await supabaseClient.auth.updateUser({ password: val });

      if (error) return alert(error.message);

      alert("Password updated!");
    });
  }
}