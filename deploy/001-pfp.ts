import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

export const deployWithLibraries = async (
  hre: HardhatRuntimeEnvironment,
) => {
  const { ethers, deployments, getNamedAccounts } = hre
	const { deploy } = deployments

	const { deployer } = await getNamedAccounts()

	const { address: utilitiesAddress } = await deploy('Utilities', {
		from: deployer,
		args: [],
		log: true,
		autoMine: true,
	})

  const { address: rendererAddress } = await deploy('ChecksPFPRenderer', {
    from: deployer,
    args: [],
    libraries: {
      Utilities: utilitiesAddress,
    },
    log: true,
    autoMine: true,
  })

  const { address: pfpAddress } = await deploy('ChecksPFP', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  })

  const checksPFP = await ethers.getContractAt('ChecksPFP', pfpAddress)
  await checksPFP.setRenderer(rendererAddress)

  return {
    utilitiesAddress,
    rendererAddress,
    pfpAddress,
  }
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  await deployWithLibraries(hre)
}

export default func

func.tags = ['ChecksPFP']
