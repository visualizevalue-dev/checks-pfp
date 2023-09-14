import fs from 'fs'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre, { ethers, deployments } from 'hardhat'
import { decodeBase64URI } from '../helpers/decode-uri'
import { impersonate } from '../helpers/impersonate'
import { JALIL, JALIL_VAULT, VV } from '../helpers/constants'
import { ZeroAddress } from 'ethers'

describe('ChecksPFP', () => {
  async function deployChecksPFP () {
    await deployments.fixture(['ChecksPFPRenderer', 'ChecksPFP'])

    const [owner] = await ethers.getSigners()
    const jalilVault = await impersonate(JALIL_VAULT, hre)

    const ChecksPFP = await deployments.get('ChecksPFP')
    const checksPFP = await ethers.getContractAt('ChecksPFP', ChecksPFP.address)
    const checks = await ethers.getContractAt('ERC721', '0x036721e5A769Cc48B3189EFbb9ccE4471E8A48B1')

    return { checksPFP, checks, owner, jalilVault }
  }

  describe('Deployment', () => {
    it('Should set the right owner', async () => {
      const { checksPFP, owner } = await loadFixture(deployChecksPFP)

      expect(await checksPFP.owner()).to.equal(owner.address)
    })
  })

  describe('Mirroring', () => {
    it('Should allow to mint a PFP', async () => {
      const { checksPFP, jalilVault } = await loadFixture(deployChecksPFP)

      // The token doesn't exist
      await expect(checksPFP.ownerOf(1001)).to.be.reverted

      // Mint the PFP
      await expect(checksPFP.connect(jalilVault).mirror(1001))
        .to.emit(checksPFP, 'Transfer')
        .withArgs(ZeroAddress, JALIL_VAULT, 1001)

      // The PFP exists and is owned by jalil
      expect(await checksPFP.ownerOf(1001)).to.equal(JALIL_VAULT)
    })

    it('Should mirror when attemting a transfer', async () => {
      const { checksPFP, checks, jalilVault } = await loadFixture(deployChecksPFP)

      // Mint the PFP
      await checksPFP.mirror(1001)

      // Transfer just mirrors...
      await expect(checksPFP.connect(jalilVault).transferFrom(JALIL_VAULT, JALIL, 1001))
        .to.be.revertedWithCustomError(checksPFP, 'AlreadyMirrored')
      await expect(checksPFP.connect(jalilVault)['safeTransferFrom(address,address,uint256)'](JALIL_VAULT, JALIL, 1001))
        .to.be.revertedWithCustomError(checksPFP, 'AlreadyMirrored')
      await expect(checksPFP.connect(jalilVault)['safeTransferFrom(address,address,uint256,bytes)'](JALIL_VAULT, JALIL, 1001, '0x'))
        .to.be.revertedWithCustomError(checksPFP, 'AlreadyMirrored')

      // Transfer the check
      await checks.connect(jalilVault).transferFrom(JALIL_VAULT, JALIL, 1001)

      // Attempt transfer (even wrong addresses work)
      await expect(checksPFP.transferFrom(VV, JALIL_VAULT, 1001))
        .to.emit(checksPFP, 'Transfer')
        .withArgs(JALIL_VAULT, JALIL, 1001)
    })

    it('Should not allow to approve a PFP', async () => {
      const { checksPFP, jalilVault } = await loadFixture(deployChecksPFP)

      // Mint the PFP
      await checksPFP.connect(jalilVault).mirror(1001)

      // Can't approve
      await expect(checksPFP.connect(jalilVault).approve(JALIL, 1001))
        .to.be.revertedWithCustomError(checksPFP, 'NoApprovals')
      await expect(checksPFP.connect(jalilVault).setApprovalForAll(JALIL, true))
        .to.be.revertedWithCustomError(checksPFP, 'NoApprovals')
    })

    it('Should allow to remirror PFP after Check was transfered', async () => {
      const { checksPFP, checks, jalilVault } = await loadFixture(deployChecksPFP)

      // Mint the PFP
      await checksPFP.connect(jalilVault).mirror(1001)
      expect(decodeBase64URI(await checksPFP.tokenURI(1001)).attributes[0].value).to.equal('Linked')

      // Transfer check
      await checks.connect(jalilVault).transferFrom(JALIL_VAULT, JALIL, 1001)
      expect(decodeBase64URI(await checksPFP.tokenURI(1001)).attributes[0].value).to.equal('Unlinked')

      // Remirror
      await expect(checksPFP.mirror(1001))
        .to.emit(checksPFP, 'Transfer')
        .withArgs(JALIL_VAULT, JALIL, 1001)

      expect(await checksPFP.ownerOf(1001)).to.equal(JALIL)
      expect(decodeBase64URI(await checksPFP.tokenURI(1001)).attributes[0].value).to.equal('Linked')
    })
  })

  describe('Rendering', () => {
    it('Should render checks', async () => {
      const { checksPFP } = await loadFixture(deployChecksPFP)

      const ids = [1776, 69, 15, 282, 1007, 376, 1001]

      await checksPFP.mirror(1001)

      for (const id of ids) {
        const svg = await checksPFP.svg(id)

        const meta = await checksPFP.tokenURI(id)
        const data = decodeBase64URI(meta)
        expect(data.name).to.equal(`Checks PFP #${id}`)
        expect(data.description).to.equal(
          id === 1001
            ? `PFP mirroring VV Checks #${id}`
            : `PFP for VV Checks #${id}. Relink to its current owner on the VV Checks website.`
        )
        expect(data.image).to.equal(`https://api.checks.art/checks/${id}/pfp.png`)

        fs.writeFileSync(`./renders/${id}.svg`, svg)
        fs.writeFileSync(`./renders/${id}.json`, JSON.stringify(data, null, 4))
      }

    })
  })
})
