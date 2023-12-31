import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

export const deployWithLibraries = async (
  hre: HardhatRuntimeEnvironment,
) => {
  const { ethers, deployments, getNamedAccounts } = hre
	const { deploy } = deployments

	const { deployer } = await getNamedAccounts()

  const { address: pfpAddress } = await deploy('ChecksPFP', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  })

  const checksPFP = await ethers.getContractAt('ChecksPFP', pfpAddress)
  const renderer = await deployments.get('ChecksPFPRenderer')
  await checksPFP.setRenderer(renderer.address)

  return {
    rendererAddress: renderer.address,
    pfpAddress,
  }
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  await deployWithLibraries(hre)
}

export default func

func.tags = ['ChecksPFP']
