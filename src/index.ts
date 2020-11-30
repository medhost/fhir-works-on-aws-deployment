/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */

import serverless from 'serverless-http';
import { generateServerlessRouter } from 'fhir-works-on-aws-routing';
import { fhirConfig, genericResources } from './config';

const serverlessHandler = serverless(generateServerlessRouter(fhirConfig, genericResources), {
    request(request: any, event: any) {
        request.user = event.user;
        request.tenantId = `-${event.pathParameters.tenantId}` || '';
        request.proxy = event.pathParameters.proxy;
    },
});

export default async (event: any = {}, context: any = {}): Promise<any> => {
    return serverlessHandler(event, context);
};
