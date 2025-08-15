/**
 * Interface for standardized EC2 instance response
 */
export interface EC2InstanceResponse {
  instanceId?: string;
  state?: string;
  instanceType?: string;
  publicIpAddress?: string;
  privateIpAddress?: string;
  launchTime?: Date;
  tags?: Record<string, string>;
  securityGroups?: {
    id?: string;
    name?: string;
  }[];
  subnetId?: string;
  vpcId?: string;
  architecture?: string;
  platform?: string;
  rootDeviceType?: string;
  rootDeviceName?: string;
}
