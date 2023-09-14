import { task } from 'hardhat/config'

task('key', 'Get the private key based off a mnemonic')
  .addParam('mnemonic', 'The mnemonic')
  .setAction(async ({ mnemonic }, hre) => {
    const { ethers } = hre;

    const mnemonicWallet = ethers.Wallet.fromPhrase(mnemonic)

    console.log(mnemonicWallet.privateKey)
  })
