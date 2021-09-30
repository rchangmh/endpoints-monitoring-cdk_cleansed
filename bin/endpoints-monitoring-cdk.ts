#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { EndpointsMonitoringCdkStack } from '../lib/endpoints-monitoring-cdk-stack'

const app = new cdk.App()

let envRegex = '<ENV>'
const endpoints = [
// endpoints
  `https://app.com/actuator/health`,
]

let env: string

env = 'dev'
new EndpointsMonitoringCdkStack(app, `${env}EndpointsMonitoring`, {
  env: {
    account: '00000000000',
    region: 'us-east-1',
  },
  requestsLayerArn: 'arn:aws:lambda:us-east-1:00000000000:layer:python-requests:1',
  endpoints: endpoints.map(url => url.replace(envRegex, env)),
  topicArn: 'arn:aws:sns:us-east-1:00000000000:dev',
  vpcId: 'vpc-000',
})
