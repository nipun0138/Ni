const formAccessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || "";
const navigation = document.querySelector(".site-navigation");
const menuToggle = document.querySelector(".menu-toggle");
const dropdownItems = document.querySelectorAll("[data-dropdown]");
const emailDropdown = document.querySelector("[data-email-dropdown]");
const emailButton = emailDropdown?.querySelector("button");
const copyEmailButtons = document.querySelectorAll("[data-copy-email]");
const contactForm = document.querySelector("#contact-form");
const feedbackBox = document.querySelector("#form-feedback");
const serviceSelect = document.querySelector("#service-select");

const setMenuState = (isOpen) => {
  if (!navigation || !menuToggle) return;

  navigation.classList.toggle("is-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
};

const closeDropdowns = () => {
  dropdownItems.forEach((item) => {
    item.classList.remove("is-open");
    const trigger = item.querySelector(".dropdown-trigger");
    trigger?.setAttribute("aria-expanded", "false");
  });
};

menuToggle?.addEventListener("click", () => {
  const isOpen = !navigation?.classList.contains("is-open");
  setMenuState(Boolean(isOpen));
});

dropdownItems.forEach((item) => {
  const trigger = item.querySelector(".dropdown-trigger");

  trigger?.addEventListener("click", () => {
    const isMobile = window.innerWidth <= 960;

    if (!isMobile) {
      const nextState = !item.classList.contains("is-open");
      closeDropdowns();
      item.classList.toggle("is-open", nextState);
      trigger.setAttribute("aria-expanded", String(nextState));
      return;
    }

    const nextState = !item.classList.contains("is-open");
    item.classList.toggle("is-open", nextState);
    trigger.setAttribute("aria-expanded", String(nextState));
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-dropdown]")) {
    closeDropdowns();
  }

  if (!event.target.closest("[data-email-dropdown]")) {
    emailDropdown?.classList.remove("is-open");
    emailButton?.setAttribute("aria-expanded", "false");
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 960) {
    setMenuState(false);
  }
});

emailButton?.addEventListener("click", () => {
  const nextState = !emailDropdown.classList.contains("is-open");
  emailDropdown.classList.toggle("is-open", nextState);
  emailButton.setAttribute("aria-expanded", String(nextState));
});

copyEmailButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const email = button.getAttribute("data-copy-email");
    const originalLabel = button.textContent;

    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);
      button.textContent = "Email copied";
      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1600);
    } catch {
      button.textContent = email;
    }
  });
});

const params = new URLSearchParams(window.location.search);
const preselectedService = params.get("service");

if (serviceSelect && preselectedService) {
  const matchingOption = Array.from(serviceSelect.options).find((option) => option.value === preselectedService || option.text === preselectedService);

  if (matchingOption) {
    serviceSelect.value = matchingOption.value || matchingOption.text;
  }
}

const setFeedback = (message, type) => {
  if (!feedbackBox) return;

  feedbackBox.textContent = message;
  feedbackBox.classList.remove("is-success", "is-error");

  if (type) {
    feedbackBox.classList.add(type === "success" ? "is-success" : "is-error");
  }
};

const isValidUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const submitButton = contactForm.querySelector(".form-submit-button");
  const accessKeyField = contactForm.querySelector('input[name="access_key"]');
  accessKeyField.value = formAccessKey;

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const service = String(formData.get("service") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!name || !email || !website || !service || !message) {
    setFeedback("Please complete all required fields before sending your inquiry.", "error");
    return;
  }

  if (!isValidUrl(website)) {
    setFeedback("Please enter a valid website URL, including https://.", "error");
    return;
  }

  if (!formAccessKey) {
    setFeedback("The contact form needs a Web3Forms access key before it can send messages.", "error");
    return;
  }

  formData.set("access_key", formAccessKey);
  formData.set("email", email);
  formData.set("name", name);
  formData.set("website", website);
  formData.set("service", service);
  formData.set("message", message);

  const payload = Object.fromEntries(formData.entries());
  submitButton.disabled = true;
  setFeedback("Sending your inquiry...", null);

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Something went wrong while sending your inquiry.");
    }

    contactForm.reset();

    if (serviceSelect && preselectedService) {
      serviceSelect.value = "";
    }

    setFeedback("Your inquiry was sent successfully. Jannatul will respond through WhatsApp or email.", "success");
  } catch (error) {
    setFeedback(error.message || "Unable to send your inquiry right now. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
  }
});
