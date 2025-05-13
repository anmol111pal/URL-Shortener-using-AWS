import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

export const handler = async (event: any) => {

    try {

        const region: string = process.env.REGION ?? 'ap-south-1';
        const tableName: string | undefined = process.env.TABLE_NAME;

        const ddbClient: DynamoDBClient = new DynamoDBClient({ region });
        const docClient: DynamoDBDocumentClient = DynamoDBDocumentClient.from(ddbClient);

        const shortUrl: string = event.pathParameters?.url;
        console.log('URL received: ', shortUrl);

        const currentTime: string = new Date().toISOString();

        const params = {
            TableName: tableName,
            KeyConditionExpression: 'shortUrl = :shortUrl',
            ExpressionAttributeValues: {
                ':shortUrl': shortUrl,
            },
        };

        const queryCommand = new QueryCommand(params);
        const fetchedData = await docClient.send(queryCommand);
        
        const doc = fetchedData.Items?.at(0);
        console.log('Fetched data: ', doc);

        const url: string = doc?.url;
        const clicks: number = doc?.clicks;
        const createdAt: string = doc?.createdAt;

        console.log('Redirecting to ', url);

        const updateParams = {
            TableName: tableName,
            Key: {
                shortUrl,
                createdAt,
            },
            UpdateExpression: 'set #clicks = :clicks + :newVal, #timestamps = list_append(if_not_exists(timestamps, :empty_list), :currentTime)',
            ExpressionAttributeNames: {
                '#clicks': 'clicks',
                '#timestamps': 'timestamps',
            },
            ExpressionAttributeValues: {
                ':clicks': clicks,
                ':newVal': 1,
                ':currentTime': [currentTime],
                ':empty_list': [],
            },
            ReturnValues: 'UPDATED_NEW' as 'UPDATED_NEW',
        };

        const updateCommand = new UpdateCommand(updateParams);
        const result = await docClient.send(updateCommand);
        console.log('Result after update: ', result);

        return {
            statusCode: 302,
            headers: {
                Location: url,
            },
        };

    } catch (err) {
        console.log('Error: ', err);

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
