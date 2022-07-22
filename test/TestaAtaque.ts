import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Vulneravel, Exploit } from "../typechain/index";

describe("Ataque a um contrato vulnerável", function () {
  let atacante!: SignerWithAddress;
  let vitima!: SignerWithAddress;
  let depositante!: SignerWithAddress;
  let contratoVulneravel!: Vulneravel;
  let contratoMalicioso!: Exploit;
  const quantia = 100; // em wei (ETH * 10 ^ -18)

  // Definimos um fixture para reusar o deploy em cada teste.
  async function deployVulneravelFixture() {
    // Contratos são publicados usando a primeira conta por padrão
    [vitima, atacante, depositante] = await ethers.getSigners();

    const Vulneravel = await ethers.getContractFactory("Vulneravel");
    contratoVulneravel = await Vulneravel.deploy();

    return { contratoVulneravel, vitima, atacante, depositante };
  }

  before(async function () {
    await loadFixture(deployVulneravelFixture);
  });

  describe("Funcionamento normal do contrato vulnerável", function () {
    it("1. Depositante deposita ETH no contrato", async function () {
      await expect(contratoVulneravel.connect(depositante).depositar({ value: quantia })).to.changeEtherBalances(
        [contratoVulneravel, depositante],
        [quantia, -quantia]
      );
      expect(await contratoVulneravel.saldoDe(await depositante.getAddress())).to.eq(quantia);
    });

    it("2. Depositante resgata ETH do contrato", async function () {
      await expect(contratoVulneravel.connect(depositante).resgatar()).to.changeEtherBalances(
        [contratoVulneravel, depositante],
        [-quantia, quantia]
      );
      expect(await contratoVulneravel.saldoDe(await depositante.getAddress())).to.eq(0);
    });
  });

  describe("Exploit", function () {
    it("0. Vamos supor que o contrato tenha saldo", async function () {
      await expect(contratoVulneravel.connect(depositante).depositar({ value: quantia })).to.changeEtherBalances(
        [contratoVulneravel, depositante],
        [quantia, -quantia]
      );
      expect(await contratoVulneravel.saldoDe(await depositante.getAddress())).to.eq(quantia);
      await expect(contratoVulneravel.connect(vitima).depositar({ value: quantia })).to.changeEtherBalances(
        [contratoVulneravel, vitima],
        [quantia, -quantia]
      );
      expect(await contratoVulneravel.saldoDe(await vitima.getAddress())).to.eq(quantia);
    });

    it("1. Atacante faz a publicação do contrato malicioso Exploit", async function () {
      const Exploit = await ethers.getContractFactory("Exploit");
      contratoMalicioso = await Exploit.connect(atacante).deploy(contratoVulneravel.address);

      await contratoMalicioso.deployed()

      expect(await contratoMalicioso.owner()).to.equal(await atacante.getAddress());
    });

    it("2. Atacante faz um depósito no contrato malicioso", async function () {
      // const quantia = await contratoMalicioso.quantia();
      await expect(contratoMalicioso.connect(atacante).fundar({ value: quantia })).to.changeEtherBalances(
        [contratoVulneravel, atacante],
        [quantia, -quantia]
      );
      // await expect(atacante.sendTransaction({ to: contratoMalicioso.address, value: quantia })).to.changeEtherBalances(
      //   [contratoMalicioso, atacante],
      //   [quantia, -quantia]
      // );
    });

    it("3. Atacante invoca o ataque", async function () {
      expect(await contratoVulneravel.saldoDe(contratoMalicioso.address)).to.eq(quantia);

      let saldoContrato = await contratoVulneravel.saldoTotal();
      await expect(contratoMalicioso.atacar()).to.changeEtherBalances(
        [contratoVulneravel, atacante],
        [-saldoContrato, saldoContrato]
      );

      expect(await contratoVulneravel.saldoDe(await atacante.getAddress())).to.eq(0);
    });
  });
});
