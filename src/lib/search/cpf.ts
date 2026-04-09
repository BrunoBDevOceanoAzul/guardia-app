function validateCpfDigits(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  if (remainder !== Number(cpf[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  return remainder === Number(cpf[10]);
}

export function normalizeCpf(input: string): string {
  const normalized = input.replace(/\D/g, "");
  if (!validateCpfDigits(normalized)) {
    throw new Error("CPF_INVALID");
  }
  return normalized;
}

export function maskCpf(input: string): string {
  const normalized = normalizeCpf(input);
  return `***.***.***-${normalized.slice(-2)}`;
}
