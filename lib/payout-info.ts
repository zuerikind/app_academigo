export type ParsedPayoutInfo = {
  payoutName: string;
  payoutIban: string;
  payoutStreet: string;
  payoutZip: string;
  payoutCity: string;
  payoutTwint: string;
};

const EMPTY: ParsedPayoutInfo = {
  payoutName: "",
  payoutIban: "",
  payoutStreet: "",
  payoutZip: "",
  payoutCity: "",
  payoutTwint: "",
};

function parseAddressLine(raw: string): Pick<ParsedPayoutInfo, "payoutStreet" | "payoutZip" | "payoutCity"> {
  const line = raw.startsWith("Adresse: ") ? raw.slice(9) : raw;
  const commaIdx = line.lastIndexOf(", ");
  if (commaIdx === -1) {
    return { payoutStreet: line, payoutZip: "", payoutCity: "" };
  }
  const payoutStreet = line.slice(0, commaIdx);
  const zipCity = line.slice(commaIdx + 2);
  const spaceIdx = zipCity.indexOf(" ");
  return {
    payoutStreet,
    payoutZip: spaceIdx !== -1 ? zipCity.slice(0, spaceIdx) : zipCity,
    payoutCity: spaceIdx !== -1 ? zipCity.slice(spaceIdx + 1) : "",
  };
}

export function parsePayoutInfo(info: string | null | undefined): ParsedPayoutInfo {
  if (!info) return { ...EMPTY };

  const result = { ...EMPTY };

  for (const line of info.split("\n").map((l) => l.trim()).filter(Boolean)) {
    if (line.startsWith("Name: ")) {
      result.payoutName = line.slice(6);
    } else if (line.startsWith("IBAN: ")) {
      result.payoutIban = line.slice(6);
    } else if (line.startsWith("Twint: ")) {
      result.payoutTwint = line.slice(7);
    } else if (line.startsWith("Adresse: ") || !line.includes(": ")) {
      Object.assign(result, parseAddressLine(line));
    }
  }

  return result;
}

export function hasPayoutInfo(info: ParsedPayoutInfo): boolean {
  return Boolean(
    info.payoutName ||
      info.payoutIban ||
      info.payoutStreet ||
      info.payoutZip ||
      info.payoutCity ||
      info.payoutTwint,
  );
}

export function formatPayoutAddress(info: ParsedPayoutInfo): string {
  const cityLine = [info.payoutZip, info.payoutCity].filter(Boolean).join(" ");
  return [info.payoutStreet, cityLine].filter(Boolean).join(", ");
}
