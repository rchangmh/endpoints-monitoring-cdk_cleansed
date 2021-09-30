import boto3
import os
import datetime
import requests

partition_key = 'endpoint'
status_key = 'status'

def get_last_status(endpoint_url, ddb_table):
    endpoint_item = ddb_table.get_item(Key={ partition_key: endpoint_url })
    last_status = str(endpoint_item.get('Item', {}).get(status_key))
    return last_status

def get_update_current_status(endpoint_url, ddb_table, timeout=2):
    try:
        status = str(requests.get(endpoint_url, timeout=timeout).status_code)
    except requests.Timeout as error:
        status = 'TIMEOUT'
    except requests.ConnectionError as error:
        status = 'INVALID'
    except Exception as error:
        status = str(error)
    ddb_table.put_item(Item={
        partition_key: endpoint_url,
        status_key: status,
        'timestamp': str(datetime.datetime.now())
    })
    return status

def lambda_handler(event, context):

    endpoints = os.environ['endpoints'].split(',')
    topic_arn = os.environ['topic_arn']
    table_name = os.environ['table_name']
    ddb_table = boto3.resource('dynamodb').Table(table_name)
    timeout = int(os.environ['wait_x_seconds'])
    
    output_alerts = []
    for endpoint_url in endpoints:
        previous_status = get_last_status(endpoint_url, ddb_table)
        current_status = get_update_current_status(endpoint_url, ddb_table, timeout)
        if (current_status != previous_status and previous_status != 'None'):
            output_alerts += [f'• {endpoint_url[8:]} ▶ {previous_status} ➡ {current_status}']

    if output_alerts:
        sns_client = boto3.client('sns')
        sns_client.publish(
            TopicArn = topic_arn,
            Subject = "Endpoints Status Change",
            Message = '\n'.join(output_alerts)
        )
