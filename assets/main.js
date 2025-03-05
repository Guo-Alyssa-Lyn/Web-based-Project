////////////////////////////
// Login Page - Function //
//////////////////////////

function switchForm(type) {
  const userForm = document.getElementById("user-form");
  const adminForm = document.getElementById("admin-form");
  const userBtn = document.getElementById("user-btn");
  const adminBtn = document.getElementById("admin-btn");

  if (!userForm || !adminForm || !userBtn || !adminBtn) {
    console.error("❌ One or more form elements not found!");
    return;
  }

  userForm.classList.toggle("hidden", type !== "user");
  adminForm.classList.toggle("hidden", type !== "admin");
  userBtn.classList.toggle("active", type === "user");
  adminBtn.classList.toggle("active", type === "admin");
}

// Login Page Interaction to Database
document.addEventListener("DOMContentLoaded", function () {
  switchForm("user"); // Default to user login

  const forms = {
    user: document.getElementById("user-form"),
    admin: document.getElementById("admin-form")
  };

  Object.keys(forms).forEach(type => {
    if (forms[type]) {
      forms[type].addEventListener("submit", (event) => handleLogin(type, event));
    }
  });

  async function handleLogin(formType, event) {
    event.preventDefault();

    const username = document.getElementById(`${formType}-username`)?.value.trim();
    const password = document.getElementById(`${formType}-password`)?.value;

    if (!username || !password) {
      alert("❌ Username and password are required!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        alert("❌ Login failed. Please check your credentials.");
        return;
      }

      const data = await response.json();
      if (data.success) {
        window.location.href = data.redirectUrl || "/user-side/user-account.html";
      } else {
        alert(data.message || "Login failed.");
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      alert("⚠️ Network error. Please try again later.");
    }
  }
});

/////////////////////////////////////
// Create Account Page - Function //
///////////////////////////////////

document.addEventListener("DOMContentLoaded", function () {
  const nextButton = document.getElementById("nextButton");
  const nextToFinal = document.getElementById("nextToFinal");
  const submitButton = document.getElementById("submitAllInfoCreateAccount");
  const statusMessage = document.getElementById("statusMessage");

  function checkFields() {
    const requiredFields = document.querySelectorAll("#accountDetails input[required]");
    nextToFinal.disabled = ![...requiredFields].every(input => input.value.trim() !== "");
  }

  document.querySelectorAll("#accountDetails input[required]").forEach(input => input.addEventListener("input", checkFields));

  async function submitAccount(event) {
    event.preventDefault();
    if (!document.getElementById("termsCheckbox").checked) {
      showStatus("Please agree to the terms.", "error");
      return;
    }

    const formData = {
      accountType: document.querySelector('input[name="accountType"]:checked')?.value || "user",
      fullName: document.getElementById("fullName").value,
      jobRole: document.getElementById("jobRole").value,
      email: document.getElementById("email").value,
      contactNumber: document.getElementById("contactNumber").value,
      username: document.getElementById("username").value,
      password: document.getElementById("password").value
    };

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) {
        showStatus(data.error || "An error occurred.", "error");
      } else {
        showStatus("Account created successfully! Redirecting...", "success");
        setTimeout(() => window.location.href = "/login-page.html", 2000);
      }
    } catch (error) {
      showStatus("Network error. Please try again.", "error");
    }
  }

  submitButton.addEventListener("click", submitAccount);

  function showStatus(message, type) {
    if (statusMessage) {
      statusMessage.textContent = message;
      statusMessage.style.display = "block";
      statusMessage.className = type;
    }
  }
});

////////////////////////////
// Function for Logout   //
//////////////////////////

document.addEventListener("DOMContentLoaded", function () {
  const logoutLink = document.querySelector(".menu-5 a");

  if (logoutLink) {
    logoutLink.addEventListener("click", async function (event) {
      event.preventDefault();
      try {
        const response = await fetch("http://localhost:5000/api/logout", { method: 'POST', credentials: 'include' });
        const data = await response.json();
        if (data.success) {
          alert("Logged out successfully!");
          window.location.href = "/login-page.html";
        } else {
          alert("Logout failed.");
        }
      } catch (error) {
        console.error("Error during logout:", error);
      }
    });
  }
});

// Check login status
document.addEventListener("DOMContentLoaded", async function () {
  try {
    const response = await fetch("http://localhost:5000/api/profile", { credentials: 'include' });
    const user = await response.json();
    if (user.message === "Not logged in") {
      window.location.href = "/login-page.html";
    } else {
      document.getElementById("userFullName").textContent = user.full_name;
    }
  } catch (error) {
    console.error("Error checking authentication:", error);
  }
});
