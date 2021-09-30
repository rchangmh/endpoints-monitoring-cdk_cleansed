import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ddb from '@aws-cdk/aws-dynamodb'
import * as sns from '@aws-cdk/aws-sns'
import * as events from '@aws-cdk/aws-events'
import * as targets from '@aws-cdk/aws-events-targets'
import * as path from 'path'

interface EndpointsMonitoringProps extends cdk.StackProps {
  requestsLayerArn?: string
  runEveryXMinutes?: number
  vpcId: string
  endpoints: string[]
  topicArn: string
}

export class EndpointsMonitoringCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: EndpointsMonitoringProps) {
    super(scope, id, props)

    const endpointsStatusTable = new ddb.Table(this, 'endpointsStatusTable', {
      partitionKey: {
        type: ddb.AttributeType.STRING,
        name: 'endpoint',
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    let requestsLayer: lambda.ILayerVersion
    if (props.requestsLayerArn) {
      requestsLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'requestsLayer', props.requestsLayerArn)
    } else {
      requestsLayer = new lambda.LayerVersion(this, 'requestsLayer', {
        layerVersionName: 'python-requests',
        code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambdas', 'python-requests.zip')),
        compatibleRuntimes: [
          lambda.Runtime.PYTHON_2_7,
          lambda.Runtime.PYTHON_3_6,
          lambda.Runtime.PYTHON_3_7,
          lambda.Runtime.PYTHON_3_8
        ],
      })
    }

    const lambdaPath = path.join(__dirname, '..', 'lambdas', 'endpoints-monitoring')
    
    const endpointsFn = new lambda.Function(this, 'endpointsFn', {
      code: lambda.Code.fromAsset(lambdaPath),
      handler: 'lambda_function.lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_8,
      environment: {
        table_name: endpointsStatusTable.tableName,
        topic_arn: props.topicArn,
        endpoints: props.endpoints.toString(),
        wait_x_seconds: '3',
      },
      layers: [requestsLayer],
      vpc: ec2.Vpc.fromLookup(this, 'lambdaVpc', { vpcId: props.vpcId }),
      timeout: cdk.Duration.minutes(2),
    })

    endpointsStatusTable.grantReadWriteData(endpointsFn)
    sns.Topic.fromTopicArn(this, 'alertTopic', props.topicArn).grantPublish(endpointsFn)

    const schedule = new events.Rule(this, 'endpointsSchedule', {
      enabled: true,
      schedule: events.Schedule.rate(cdk.Duration.minutes(props.runEveryXMinutes ?? 5)),
      targets: [new targets.LambdaFunction(endpointsFn)],
    })


  }
}
