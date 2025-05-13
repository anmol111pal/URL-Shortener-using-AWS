import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaIntegration, RestApi, Cors } from 'aws-cdk-lib/aws-apigateway';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import path = require('path');

export class UrlShortenerAwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api: RestApi = new RestApi(this, 'UrlShortener-Rest API', {
      restApiName: 'UrlShortener',
      description: 'Url Shortener Rest API',
    });

    const urlTable: Table = new Table(this, 'url-table', {
      tableName: 'url-table',
      partitionKey: {
        name: 'shortUrl',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    
    const shortenUrlFunction: Function = new Function(this, 'Shorten-URL-Function', {
      functionName: 'Shorten-URL-Function',
      runtime: Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: Code.fromAsset(path.join(__dirname, '../lambda/shorten-url')),
      memorySize: 256,
      environment: {
        TABLE_NAME: urlTable.tableName,
        REGION: this.region
      },
    });

    const redirectUrlFunction: Function = new Function(this, 'Redirect-URL-Function', {
      functionName: 'Redirect-URL-Function',
      runtime: Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: Code.fromAsset(path.join(__dirname, '../lambda/redirect-url')),
      memorySize: 256,
      environment: {
        TABLE_NAME: urlTable.tableName,
        REGION: this.region
      },
    });

    

    urlTable.grantReadWriteData(redirectUrlFunction);
    urlTable.grantWriteData(shortenUrlFunction);

    const shortenUrlResource = api.root.addResource('shorten-url');
    const redirectUrlResource = api.root.addResource('{url}');

    shortenUrlResource.addMethod('POST', new LambdaIntegration(shortenUrlFunction));
    redirectUrlResource.addMethod('GET', new LambdaIntegration(redirectUrlFunction));

    redirectUrlResource.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowMethods: ['GET'],
      allowHeaders: Cors.DEFAULT_HEADERS,
    });

    shortenUrlResource.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowMethods: ['POST'],
      allowHeaders: Cors.DEFAULT_HEADERS,
    });

  }
}
