import * as core from '@actions/core'

import {Kubectl} from '../../types/kubectl'

import {BlueGreenDeployment} from '../../types/blueGreenTypes'
import {deployWithLabel, NONE_LABEL_VALUE} from './blueGreenHelper'

import {validateIngresses} from './ingressBlueGreenHelper'
import {validateServicesState} from './serviceBlueGreenHelper'
import {validateTrafficSplitsState} from './smiBlueGreenHelper'

export async function promoteBlueGreenIngress(
   kubectl: Kubectl,
   manifestObjects,
   timeout?: string
): Promise<BlueGreenDeployment> {
   //checking if anything to promote
   const {areValid, invalidIngresses} = await validateIngresses(
      kubectl,
      manifestObjects.ingressEntityList,
      manifestObjects.serviceNameMap
   )
   if (!areValid) {
      throw new Error(
         `Ingresses are not in promote state: ${invalidIngresses.toString()}`
      )
   }

   // create stable deployments with new configuration
   const result: BlueGreenDeployment = await deployWithLabel(
      kubectl,
      [].concat(
         manifestObjects.deploymentEntityList,
         manifestObjects.serviceEntityList
      ),
      NONE_LABEL_VALUE,
      timeout
   )

   // create stable services with new configuration
   return result
}

export async function promoteBlueGreenService(
   kubectl: Kubectl,
   manifestObjects,
   timeout?: string
): Promise<BlueGreenDeployment> {
   // checking if services are in the right state ie. targeting green deployments
   if (
      !(await validateServicesState(kubectl, manifestObjects.serviceEntityList))
   ) {
      throw new Error('Found services not in promote state')
   }

   // creating stable deployments with new configurations
   return await deployWithLabel(
      kubectl,
      manifestObjects.deploymentEntityList,
      NONE_LABEL_VALUE,
      timeout
   )
}

export async function promoteBlueGreenSMI(
   kubectl: Kubectl,
   manifestObjects,
   timeout?: string
): Promise<BlueGreenDeployment> {
   // checking if there is something to promote
   if (
      !(await validateTrafficSplitsState(
         kubectl,
         manifestObjects.serviceEntityList
      ))
   ) {
      throw Error('Not in promote state SMI')
   }

   // create stable deployments with new configuration
   return await deployWithLabel(
      kubectl,
      manifestObjects.deploymentEntityList,
      NONE_LABEL_VALUE,
      timeout
   )
}
