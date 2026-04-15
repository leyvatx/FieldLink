import re

from rest_framework import serializers


E164_PATTERN = re.compile(r'^\+[1-9]\d{6,14}$')


def normalize_phone_e164(value, *, allow_blank=True, field_label='Teléfono'):
    """
    Normalize a phone number to E.164 format (+[country code][number], 7-15 digits total).

    - Accepts input already in E.164 or free-form (digits, spaces, parentheses, dashes).
    - Strips everything that isn't a digit or the leading '+'.
    - Rejects numbers that don't match E.164 after cleaning.
    - If allow_blank is True, empty/None returns ''.
    """
    if value is None:
        value = ''

    value = str(value).strip()
    if not value:
        if allow_blank:
            return ''
        raise serializers.ValidationError(f'{field_label} es obligatorio.')

    has_plus = value.startswith('+')
    digits_only = re.sub(r'[^0-9]', '', value)

    if not digits_only:
        raise serializers.ValidationError(f'{field_label} no es válido.')

    normalized = f'+{digits_only}' if has_plus else f'+{digits_only}'

    if not E164_PATTERN.match(normalized):
        raise serializers.ValidationError(
            f'{field_label} debe estar en formato internacional (+código y 7 a 15 dígitos).'
        )

    return normalized
