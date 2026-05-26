const USER_STORAGE_KEY = "user";
const USERS_STORAGE_KEY = "urgentflow_mock_users";
const SOCIAL_PROVIDER_LABELS = {
  google: "Google",
  facebook: "Facebook",
  apple: "Apple",
};
const ADMIN_SERVICE_KEYWORDS = [
  "emergency",
  "dentistry",
  "dermatology",
  "cardiology",
  "pediatrics",
  "surgery",
  "radiology",
  "pharmacy",
  "generalmedicine",
  "general-medicine",
  "general_medicine",
];

function parseJson(value, fallback) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function getStoredUser() {
  return (
    parseJson(localStorage.getItem(USER_STORAGE_KEY), null) ||
    parseJson(sessionStorage.getItem(USER_STORAGE_KEY), null)
  );
}

export function setStoredUser(user, rememberMe = false) {
  const targetStorage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;
  const normalisedUser = normaliseUser(user);

  otherStorage.removeItem(USER_STORAGE_KEY);
  targetStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalisedUser));
}

export function clearStoredUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
}

export function getMockUsers() {
  return parseJson(localStorage.getItem(USERS_STORAGE_KEY), []);
}

function saveMockUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function isSuperAdminEmail(email) {
  const normalisedEmail = String(email || "").trim().toLowerCase();
  return normalisedEmail.includes("superadmin") || (
    normalisedEmail.includes("super") && normalisedEmail.includes("admin")
  );
}

function extractAdminService(email) {
  const normalisedEmail = String(email || "").trim().toLowerCase();
  if (!normalisedEmail.includes("admin")) {
    return "";
  }

  const compactEmail = normalisedEmail.replace(/[^a-z]/g, "");
  const matchedKeyword = ADMIN_SERVICE_KEYWORDS.find((keyword) =>
    compactEmail.includes(keyword.replace(/[^a-z]/g, "")),
  );

  if (!matchedKeyword) {
    return "all";
  }

  if (matchedKeyword.startsWith("general")) {
    return "General Medicine";
  }

  return matchedKeyword.charAt(0).toUpperCase() + matchedKeyword.slice(1);
}

function normaliseUser(record) {
  // Role and serviceScope come from the DB — never derived from email
  const role = record.role || "patient";
  const serviceScope = record.serviceScope || record.service_scope || "";

  return {
    ...record,
    role,
    serviceScope,
    diseases: Array.isArray(record.diseases)
      ? record.diseases.map((item) =>
          typeof item === "string" ? item : item?.value || item?.label || "",
        )
      : [],
    bloodType:
      typeof record.bloodType === "string"
        ? record.bloodType
        : record.bloodType?.value || "",
  };
}

export function registerMockUser(formData) {
  const users = getMockUsers();
  const email = formData.email.trim().toLowerCase();

  if (users.some((user) => user.email.toLowerCase() === email)) {
    return {
      success: false,
      message: "An account with this email already exists.",
    };
  }

  const newUser = normaliseUser({
    ...formData,
    id: Date.now(),
    email,
    role: "patient",
  });

  users.push(newUser);
  saveMockUsers(users);

  return { success: true, user: newUser };
}

export function authenticateMockUser(email, password) {
  const users = getMockUsers();
  const matchedUser = users.find(
    (user) =>
      user.email.toLowerCase() === email.trim().toLowerCase() &&
      user.password === password,
  );

  if (!matchedUser) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  return { success: true, user: normaliseUser(matchedUser) };
}

export function authenticateSocialUser(provider) {
  const normalisedProvider = String(provider || "").trim().toLowerCase();
  const providerLabel =
    SOCIAL_PROVIDER_LABELS[normalisedProvider] || "Social";
  const users = getMockUsers();
  const email = `${normalisedProvider}.demo@urgentflow.social`;

  const existingUser = users.find(
    (user) => String(user.email || "").toLowerCase() === email,
  );

  if (existingUser) {
    return {
      success: true,
      user: normaliseUser(existingUser),
      message: `${providerLabel} sign-in completed.`,
    };
  }

  const user = normaliseUser({
    id: Date.now(),
    fullName: `${providerLabel} Demo User`,
    email,
    phone: "20123456",
    city: "Tunis",
    address: "Demo address",
    date: "1998-01-01",
    gender: "female",
    bloodType: "O+",
    diseases: ["none"],
    allergies: "",
    password: `${normalisedProvider}-demo`,
    authProvider: normalisedProvider,
    role: "patient",
  });

  saveMockUsers([...users, user]);

  return {
    success: true,
    user,
    message: `${providerLabel} sign-in completed.`,
  };
}

export function updateMockPassword(email, password) {
  const users = getMockUsers();
  const index = users.findIndex(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase(),
  );

  if (index === -1) {
    return {
      success: false,
      message: "No account was found for this email.",
    };
  }

  users[index] = normaliseUser({ ...users[index], password });
  saveMockUsers(users);

  return { success: true, user: users[index] };
}
