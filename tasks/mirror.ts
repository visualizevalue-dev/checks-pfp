import { task } from 'hardhat/config'

task('mirror', 'Mirror checks tokens')
  .addParam('tokens', 'The token IDs to mirror, separated by commas')
  .setAction(async ({ tokens }, hre) => {
    const { getNamedAccounts } = hre;

    const { deployer } = await getNamedAccounts();
    const signer = await hre.ethers.getSigner(deployer)

    const ChecksPFP = await hre.deployments.get('ChecksPFP')
    const contract = await hre.ethers.getContractAt('ChecksPFP', ChecksPFP.address, signer)

    const tokenIds = tokens.split(',').map((t: string) => parseInt(t))

    for (const id of tokenIds) {
      await contract.connect(signer).mirror(id)
    }
  })
