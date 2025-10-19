import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

// Read the compiled contract artifact
const artifactPath = join(
  __dirname,
  "../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json",
);

const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));

const abiContent = `// ABI for CertificateRegistry contract
// Auto-generated - Do not edit manually
// Run 'pnpm update-abi' to regenerate
export const CERTIFICATE_REGISTRY_ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;
`;

const outputPath = join(
  __dirname,
  "../../blockchain_project/src/lib/web3/contract-abi.ts",
);

writeFileSync(outputPath, abiContent, "utf-8");

console.log("✅ ABI updated successfully at:", outputPath);
