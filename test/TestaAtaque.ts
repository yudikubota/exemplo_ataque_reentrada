import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Vulneravel, Exploit } from "../typechain/index";
import { BigNumber } from "ethers";

describe("Ataque a um contrato vulnerável", function () {
  let atacante!: SignerWithAddress;
  let vitma!: SignerWithAddress;
  let depositante!: SignerWithAddress;
  let contratoVulneravel!: Vulneravel;
  let contratoMalicioso!: Exploit;

  // Definimos um fixture para reusar o deploy em cada teste.
  async function deployVulneravelFixture() {
    // Contratos são publicados usando a primeira conta por padrão
    const [vitma, atacante, depositante] = await ethers.getSigners();

    const Vulneravel = await ethers.getContractFactory("Vulneravel");
    contratoVulneravel = await Vulneravel.deploy();

    return { contratoVulneravel, vitma, atacante, depositante };
  }

  before(async function () {
    await loadFixture(deployVulneravelFixture);
  });

  describe("Vulneravel", function () {
    it("1. Depositante deposita ETH no contrato", async function () {
      expect(await contratoVulneravel.saldoTotal()).to.eq(BigNumber.from(0))
      await (await contratoVulneravel.connect(depositante).depositar({ value: 100 })).wait();
      expect(await contratoVulneravel.saldoTotal()).to.eq(BigNumber.from(100))
    });

    it("2. Depositante resgata ETH do contrato", async function () {
      expect(await contratoVulneravel.saldoTotal()).to.eq(BigNumber.from(100))
      await (await contratoVulneravel.connect(depositante).resgatar()).wait();
      expect(await contratoVulneravel.saldoTotal()).to.eq(BigNumber.from(0))
    });
  });

  describe("Exploit", function () {
    it("1. Atacante faz a publicação do contrato malicioso Exploit", async function () {
      const Exploit = await ethers.getContractFactory("Exploit");
      contratoMalicioso = await Exploit.connect(atacante).deploy(contratoVulneravel.address);

      expect(await contratoMalicioso.owner()).to.equal(atacante.address);
    });

    it("2. Atacante faz um depósito no contrato vulnerável", async function () {
      await (await contratoVulneravel.depositar({ value: 100 })).wait();
    });

    it("3. Atacante invoca o ataque", async function () {
      await (await contratoMalicioso.atacar()).wait()
    });
  });

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployOneYearLockFixture);

  //       await expect(lock.withdraw()).to.be.revertedWith(
  //         "You can't withdraw yet"
  //       );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We use lock.connect() to send a transaction from another account
  //       await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
  //         "You aren't the owner"
  //       );
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const { lock, unlockTime } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).not.to.be.reverted;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const { lock, unlockTime, lockedAmount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw())
  //         .to.emit(lock, "Withdrawal")
  //         .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
  //     });
  //   });

  //   describe("Transfers", function () {
  //     it("Should transfer the funds to the owner", async function () {
  //       const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).to.changeEtherBalances(
  //         [owner, lock],
  //         [lockedAmount, -lockedAmount]
  //       );
  //     });
  //   });
  // });
});
