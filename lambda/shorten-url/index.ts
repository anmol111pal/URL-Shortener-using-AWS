import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'crypto';

export const handler = async (event: any) => {
    try {
        const body = JSON.parse(event?.body);
        const url: string = body?.url;

        if (!url) {
            console.error('Missing url field in request body');

            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Missing url field in request body'
                })
            };
        }

        console.log('URL received: ', url);

        const region: string = process.env.REGION ?? 'ap-south-1';
        const tableName: string|undefined = process.env.TABLE_NAME;

        const ddbClient: DynamoDBClient = new DynamoDBClient({region});
        const docClient: DynamoDBDocumentClient = DynamoDBDocumentClient.from(ddbClient);

        const shortUrl: string = randomUUID().slice(0, 8);

        const item = {
            clicks: 0,
            url,
            shortUrl,
            timestamp: new Date().toISOString()
        };
        
        const putCommand = new PutCommand({
            TableName: tableName,
            Item: item,
        });
        
        await docClient.send(putCommand);

        console.log('URL shortened - ', shortUrl);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Item added successfully',
                item
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }

    } catch (err) {
        console.error('Some error occurred: ', err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                msg: 'some error occurred',
                err,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        };
    } 
};
