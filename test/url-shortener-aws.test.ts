import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as UrlShortenerAws from '../lib/url-shortener-aws-stack';

describe('Test resource creation', () => {
    let template: Template;

    beforeEach(() => {
        const app = new cdk.App();
        const stack = new UrlShortenerAws.UrlShortenerAwsStack(app, 'MyTestStack');
        template = Template.fromStack(stack);
    });
    
    test('API gateway Created', () => {
        template.hasResource('AWS::ApiGateway::RestApi', {});
    });

    test('Shorten URL Lambda Created', () => {
        template.hasResource('AWS::Lambda::Function', {});
    });

    test('Redirect URL Lambda Created', () => {
        template.hasResource('AWS::Lambda::Function', {});
    });

    test('Dynamo DB Table Created', () => {
        template.hasResource('AWS::DynamoDB::Table', {});
    });
});