import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "ethers";

const CertificateRegistryModule = buildModule("CertificateRegistryModule", (m) => {
  // Set fees (0.01 ETH for registration, 0.005 ETH for certificate issuance)
  const registrationFee = m.getParameter("registrationFee", parseEther("0.0001"));
  const issuanceFee = m.getParameter("issuanceFee", parseEther("0.00005"));

  // Deploy the CertificateRegistry contract
  const certificateRegistry = m.contract("CertificateRegistry", [
    registrationFee,
    issuanceFee,
  ]);

  return { certificateRegistry };
});

export default CertificateRegistryModule;
