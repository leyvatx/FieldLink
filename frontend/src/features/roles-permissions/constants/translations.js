export const FIELD_TRANSLATIONS = {
  name: 'nombre',
  description: 'descripción',
  module: 'módulo',
  submodule: 'submódulo',
};

export const ERROR_TRANSLATIONS = {
  'The name has already been taken.': 'Este nombre ya está en uso. Por favor, elija otro.',
  'The name field is required.': 'El nombre es obligatorio.',
  'The description field is required.': 'La descripción es obligatoria.',
  'The module field is required.': 'El módulo es obligatorio.',
  'The submodule field is required.': 'El submódulo es obligatorio.',
};

export const ERROR_PATTERNS = [
  {
    regex: /The (.+) field is required\./,
    translation: (field) => `El campo ${FIELD_TRANSLATIONS[field] || field} es obligatorio.`,
  },
  {
    regex: /The (.+) has already been taken\./,
    translation: (field) => `El ${FIELD_TRANSLATIONS[field] || field} ya ha sido utilizado, intenta con otro.`,
  },
];