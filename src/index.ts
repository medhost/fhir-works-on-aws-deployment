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
    },
});
const logCorrelationIds = (event: any) => {
    const trackingIdKey = process.env.TRACKING_ID_KEY || 'tracking-Id';
    // eslint-disable-next-line no-underscore-dangle
    const xrayTraceId = process.env._X_AMZN_TRACE_ID;
    console.log(`Correlation log: XRayTrackingID=${xrayTraceId} and ${trackingIdKey}=${event.headers[trackingIdKey]}`);
};
export default async (event: any = {}, context: any = {}): Promise<any> => {
    logCorrelationIds(event);
    return serverlessHandler(event, context);
};
