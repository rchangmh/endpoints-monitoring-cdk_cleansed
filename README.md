# Endpoints Monitoring CDK

This CDK deploys a Lambda function into a given VPC and a DynamoDB table. The Lambda is triggered by a CloudWatch rule, hits a list of endpoints, puts the status into the DynamoDB table, and reports changes in status to an SNS topic.

## Stack Inputs:
* **vpcId**: ID of the VPC to deploy Lambda function into.
* **endpoints**: List of URLs to hit.
* **topicArn**: SNS topic to send alerts to.
* **requestsLayerArn**: Optional: ARN for the Python requests layer, will deploy one if not given. 
* **runEveryXMinutes**: Optional: The rate to check on each endpoints. Defaults to 5 minutes.

## Commands

 * `npm run build` ➡ compile typescript to js
 * `npm run watch` ➡ watch for changes and compile
 * `cdk synth` ➡ emits the synthesized CloudFormation template
 * **`cdk deploy {aws_env}EndpointsMonitoring --profile {aws_profile}` ➡ deploy this stack**
 * `cdk diff {aws_env}EndpointsMonitoring --profile {aws_profile}` ➡ compare deployed stack with current state
