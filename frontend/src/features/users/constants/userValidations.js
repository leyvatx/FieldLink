export const USER_ROLE_OPTIONS = [
  { value: "OWNER", label: "Empresa" },
  { value: "DISPATCHER", label: "Coordinador" },
  { value: "TECHNICIAN", label: "Técnico" },
];

export const getAllowedUserRoleOptions = (currentUserRole) => {
  if (currentUserRole === "DISPATCHER") {
    return USER_ROLE_OPTIONS.filter((option) => option.value === "TECHNICIAN");
  }

  return USER_ROLE_OPTIONS;
};

export const USER_VALIDATION_RULES = {
  name: [
    { required: true, message: "El nombre es obligatorio." },
    { min: 2, message: "El nombre debe tener al menos 2 caracteres." },
    { max: 150, message: "El nombre no puede exceder 150 caracteres." },
  ],
  phone: [
    { max: 20, message: "El teléfono no puede exceder 20 caracteres." },
  ],
  email: [
    { required: true, message: "El correo es obligatorio." },
    { type: "email", message: "Ingresa un correo válido." },
    { max: 254, message: "El correo no puede exceder 254 caracteres." },
  ],
  password: [
    { required: true, message: "La contraseña es obligatoria." },
    { min: 8, message: "La contraseña debe tener al menos 8 caracteres." },
  ],
  passwordConfirmation: [
    { required: true, message: "Por favor, confirma la contraseña." },
    { min: 8, message: "La contraseña debe tener al menos 8 caracteres." },
  ],
  newPassword: [
    { required: true, message: "Por favor, ingresa la nueva contraseña." },
    { min: 8, message: "La contraseña debe tener al menos 8 caracteres." },
  ],
  role: [{ required: true, message: "Debes seleccionar un rol." }],
};

export const CHARACTER_LIMITS = {
  name: 150,
  phone: 20,
  email: 254,
};

export const FIELD_TOOLTIPS = {
  name: "Nombre del usuario.",
  phone: "Teléfono de contacto.",
  email: "Dirección de correo electrónico del usuario.",
};

export const FIELD_PLACEHOLDERS = {
  name: "Ingresa el nombre",
  phone: "Ingresa el teléfono",
  email: "Ingresa el correo",
  role: "Selecciona el rol del usuario",
};
