import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

export const deployWithLibraries = async (
  hre: HardhatRuntimeEnvironment,
) => {
  const { deployments, getNamedAccounts } = hre
	const { deploy } = deployments

	const { deployer } = await getNamedAccounts()

  const { address: rendererAddress } = await deploy('ChecksPFPRenderer', {
    from: deployer,
    args: [],
    libraries: {
      Utilities: '0x9a4DCF3Fd4174F8F170F9b31eAf16001529ae613',
    },
    log: true,
    autoMine: true,
  })

  return {
    rendererAddress,
  }
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  await deployWithLibraries(hre)
}

export default func

func.tags = ['ChecksPFPRenderer']
