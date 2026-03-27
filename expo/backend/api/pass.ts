import type { Context } from "hono";

type CertBundle = {
  wwdr: Buffer;
  signerCert: Buffer;
  signerKey: Buffer;
  signerKeyPassphrase?: string;
};

function sanitizeMemberId(raw: string): string | null {
  const memberId = raw.trim();
  if (!memberId) return null;
  if (memberId.length > 64) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(memberId)) return null;
  return memberId;
}

function bufferFromBase64Env(envName: string): Buffer | null {
  const value = process.env[envName];
  if (!value) return null;
  try {
    return Buffer.from(value, "base64");
  } catch {
    return null;
  }
}

async function bufferFromFile(filePath: string): Promise<Buffer | null> {
  try {
    const { readFile } = await import("node:fs/promises");
    return await readFile(filePath);
  } catch {
    return null;
  }
}

async function loadCertificates(): Promise<CertBundle | null> {
  const path = await import("node:path");
  const certDir = process.env.PASSKIT_CERT_DIR ?? path.join(process.cwd(), "backend", "certs");

  const wwdr =
    bufferFromBase64Env("PASSKIT_WWDR_PEM_BASE64") ??
    (await bufferFromFile(process.env.PASSKIT_WWDR_PEM_PATH ?? path.join(certDir, "wwdr.pem")));

  const signerCert =
    bufferFromBase64Env("PASSKIT_SIGNER_CERT_BASE64") ??
    (await bufferFromFile(
      process.env.PASSKIT_SIGNER_CERT_PATH ?? path.join(certDir, "signerCert.pem")
    ));

  const signerKey =
    bufferFromBase64Env("PASSKIT_SIGNER_KEY_BASE64") ??
    (await bufferFromFile(process.env.PASSKIT_SIGNER_KEY_PATH ?? path.join(certDir, "signerKey.pem")));

  if (!wwdr || !signerCert || !signerKey) return null;

  const signerKeyPassphrase = process.env.PASSKIT_SIGNER_KEY_PASSPHRASE;

  return {
    wwdr,
    signerCert,
    signerKey,
    signerKeyPassphrase: signerKeyPassphrase ? signerKeyPassphrase : undefined,
  };
}

export const appleWalletHandler = async (c: Context) => {
  const memberIdParam = c.req.param("memberId");
  const memberId = sanitizeMemberId(memberIdParam);
  if (!memberId) {
    return c.json({ error: "Invalid memberId" }, 400);
  }

  const passTypeIdentifier = process.env.PASSKIT_PASS_TYPE_IDENTIFIER;
  const teamIdentifier = process.env.PASSKIT_TEAM_IDENTIFIER;
  if (!passTypeIdentifier || !teamIdentifier) {
    return c.text(
      [
        "Apple Wallet pass is not configured.",
        "",
        "Set environment variables:",
        "- PASSKIT_PASS_TYPE_IDENTIFIER",
        "- PASSKIT_TEAM_IDENTIFIER",
        "",
        "And provide certificates via either:",
        "- PASSKIT_CERT_DIR (default: backend/certs)",
        "  - wwdr.pem",
        "  - signerCert.pem",
        "  - signerKey.pem",
        "  - PASSKIT_SIGNER_KEY_PASSPHRASE (optional)",
        "",
        "Or base64 env vars:",
        "- PASSKIT_WWDR_PEM_BASE64",
        "- PASSKIT_SIGNER_CERT_BASE64",
        "- PASSKIT_SIGNER_KEY_BASE64",
      ].join("\n"),
      501
    );
  }

  let PKPass: any;
  try {
    ({ PKPass } = await import("passkit-generator"));
  } catch {
    return c.text(
      "passkit-generator is not installed. Add it with: `bun add passkit-generator` (or `npm i passkit-generator`).",
      501
    );
  }

  const certificates = await loadCertificates();
  if (!certificates) {
    return c.text(
      [
        "Apple Wallet certificates are missing.",
        "",
        "Expected by default:",
        "- backend/certs/wwdr.pem",
        "- backend/certs/signerCert.pem",
        "- backend/certs/signerKey.pem",
        "",
        "Override paths with:",
        "- PASSKIT_CERT_DIR, PASSKIT_WWDR_PEM_PATH, PASSKIT_SIGNER_CERT_PATH, PASSKIT_SIGNER_KEY_PATH",
        "",
        "Or provide base64 env vars:",
        "- PASSKIT_WWDR_PEM_BASE64, PASSKIT_SIGNER_CERT_BASE64, PASSKIT_SIGNER_KEY_BASE64",
      ].join("\n"),
      501
    );
  }

  const path = await import("node:path");
  const modelPath =
    process.env.PASSKIT_MODEL_PATH ??
    path.join(process.cwd(), "backend", "passModels", "ten-seconds.pass");

  try {
    const organizationName = process.env.PASSKIT_ORGANIZATION_NAME ?? "Ten Seconds Rice Noodle";
    const description = process.env.PASSKIT_DESCRIPTION ?? "Ten Seconds VIP Card";
    const logoText = process.env.PASSKIT_LOGO_TEXT ?? "Ten Seconds VIP";

    const pass = await PKPass.from(
      {
        model: modelPath,
        certificates,
      },
      {
        serialNumber: `tenseconds-${memberId}`,
        passTypeIdentifier,
        teamIdentifier,
        organizationName,
        description,
        logoText,
      }
    );

    pass.setBarcodes(memberId);

    // Keep fields minimal; Wallet will always show the barcode.
    if (Array.isArray(pass.primaryFields) && pass.primaryFields.length === 0) {
      pass.primaryFields.push({
        key: "memberId",
        label: "Member ID",
        value: memberId,
      });
    }

    const buffer: Buffer = pass.getAsBuffer();
    const headers = new Headers();
    headers.set("Content-Type", "application/vnd.apple.pkpass");
    headers.set("Content-Disposition", `attachment; filename="ten-seconds-${memberId}.pkpass"`);
    headers.set("Cache-Control", "no-store");

    return new Response(buffer, { status: 200, headers });
  } catch (error) {
    console.error("[PassKit] Failed to generate pass:", error);
    return c.text("Failed to generate Apple Wallet pass.", 500);
  }
};

