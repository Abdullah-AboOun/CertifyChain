import { ethers } from "ethers";
import { CERTIFICATE_REGISTRY_ABI } from "./contract-abi";

// Default to localhost Hardhat network
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";

export function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getContract(
  signerOrProvider?: ethers.Signer | ethers.Provider,
) {
  const providerOrSigner = signerOrProvider || getProvider();
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    CERTIFICATE_REGISTRY_ABI,
    providerOrSigner,
  );
}

export async function getSigner(provider: ethers.BrowserProvider) {
  return await provider.getSigner();
}

export function getBrowserProvider() {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  throw new Error("No ethereum provider found");
}

// Helper functions
export async function requestAccounts() {
  if (typeof window !== "undefined" && window.ethereum) {
    return await window.ethereum.request({ method: "eth_requestAccounts" });
  }
  return [];
}

export async function getConnectedAccount(): Promise<string | null> {
  try {
    const provider = getBrowserProvider();
    const signer = await provider.getSigner();
    return await signer.getAddress();
  } catch (error) {
    console.error("Error getting connected account:", error);
    return null;
  }
}

// Contract interaction helpers
export async function registerEntity(name: string, fee: bigint) {
  const provider = getBrowserProvider();
  const signer = await getSigner(provider);
  const contract = getContract(signer);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (contract as any).registerEntity(name, { value: fee });
  return await tx.wait();
}

export async function issueCertificate(
  certificateHash: string,
  metadata: string,
  fee: bigint,
) {
  const provider = getBrowserProvider();
  const signer = await getSigner(provider);
  const contract = getContract(signer);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (contract as any).issueCertificate(
    certificateHash,
    metadata,
    { value: fee },
  );
  return await tx.wait();
}

export async function revokeCertificate(certificateId: number) {
  const provider = getBrowserProvider();
  const signer = await getSigner(provider);
  const contract = getContract(signer);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (contract as any).revokeCertificate(certificateId);
  return await tx.wait();
}

export async function verifyCertificate(certificateId: number) {
  const contract = getContract();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (contract as any).verifyCertificate(certificateId);
}

export async function getEntityInfo(address: string) {
  const contract = getContract();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (contract as any).getEntityInfo(address);
}

export async function getEntityCertificates(address: string) {
  const contract = getContract();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (contract as any).getEntityCertificates(address);
}

export async function isEntityRegistered(address: string): Promise<boolean> {
  const contract = getContract();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (contract as any).isRegisteredEntity(address);
}

export async function getRegistrationFee(): Promise<bigint> {
  const contract = getContract();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (contract as any).registrationFee();
}

export async function getIssuanceFee(): Promise<bigint> {
  const contract = getContract();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (contract as any).certificateIssuanceFee();
}

// TypeScript declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: string;
        params?: unknown[];
      }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (
        event: string,
        callback: (...args: unknown[]) => void,
      ) => void;
    };
  }
}
