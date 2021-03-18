/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */

import {
    BASE_R4_RESOURCES,
    BASE_STU3_RESOURCES,
    FhirConfig,
    FhirVersion,
    Resource,
    stubs,
} from 'fhir-works-on-aws-interface';
import { ElasticSearchService } from 'fhir-works-on-aws-search-es';
import { RBACHandler } from 'fhir-works-on-aws-authz-rbac';
import {
    DynamoDb,
    DynamoDbDataService,
    DynamoDbBundleService,
    S3DataService,
    DynamoDbUtil,
} from 'fhir-works-on-aws-persistence-ddb';
import RBACRules from './RBACRules';

const { IS_OFFLINE } = process.env;

const fhirVersion: FhirVersion = '4.0.1';
const baseResources = fhirVersion === '4.0.1' ? BASE_R4_RESOURCES : BASE_STU3_RESOURCES;
const authService = IS_OFFLINE ? stubs.passThroughAuthz : new RBACHandler(RBACRules(baseResources), fhirVersion);
const dynamoDbDataService = new DynamoDbDataService(DynamoDb);
const dynamoDbBundleService = new DynamoDbBundleService(DynamoDb);
const esSearch = new ElasticSearchService(
    [
        {
            key: 'documentStatus',
            value: ['AVAILABLE'],
            comparisonOperator: '==',
            logicalOperator: 'AND',
        },
    ],
    DynamoDbUtil.cleanItem,
    fhirVersion,
);

const s3DataService = new S3DataService(dynamoDbDataService, fhirVersion);

const OAuthUrl =
    process.env.OAUTH2_DOMAIN_ENDPOINT === '[object Object]' || process.env.OAUTH2_DOMAIN_ENDPOINT === undefined
        ? 'https://OAUTH2.com'
        : process.env.OAUTH2_DOMAIN_ENDPOINT;

const supportedResource: Resource = {
    operations: ['read', 'search-type'],
    fhirVersions: [fhirVersion],
    persistence: dynamoDbDataService,
    typeSearch: esSearch,
    typeHistory: stubs.history,
};

export const fhirConfig: FhirConfig = {
    configVersion: 1.0,
    productInfo: {
        orgName: 'Organization Name',
    },
    auth: {
        authorization: authService,
        // Used in Capability Statement Generation only
        strategy: {
            service: 'OAuth',
            oauthPolicy: {
                authorizationEndpoint: `${OAuthUrl}/authorize`,
                tokenEndpoint: `${OAuthUrl}/token`,
            },
        },
    },
    server: {
        // When running serverless offline, env vars are expressed as '[object Object]'
        // https://github.com/serverless/serverless/issues/7087
        // As of May 14, 2020, this bug has not been fixed and merged in
        // https://github.com/serverless/serverless/pull/7147
        url:
            process.env.API_URL === '[object Object]' || process.env.API_URL === undefined
                ? 'https://API_URL.com'
                : process.env.API_URL,
    },
    logging: {
        // Unused at this point
        level: 'error',
    },

    profile: {
        systemOperations: ['transaction'],
        bundle: dynamoDbBundleService,
        systemHistory: stubs.history,
        systemSearch: stubs.search,
        bulkDataAccess: dynamoDbDataService,
        fhirVersion,
        resources: {
            AllergyIntolerance: supportedResource,
            CarePlan: supportedResource,
            CareTeam: supportedResource,
            Condition: supportedResource,
            Demographics: supportedResource,
            Device: supportedResource,
            DiagnosticReport: supportedResource,
            DocumentReference: supportedResource,
            Encounter: supportedResource,
            Goal: supportedResource,
            Immunizations: supportedResource,
            Location: supportedResource,
            Medication: supportedResource,
            MedicationRequest: supportedResource,
            Observation: supportedResource,
            Organization: supportedResource,
            Patient: supportedResource,
            Practitioner: supportedResource,
            PractitionerRole: supportedResource,
            Procedure: supportedResource,
            Provenance: supportedResource,
            Binary: {
                operations: ['read'],
                fhirVersions: [fhirVersion],
                persistence: s3DataService,
                typeSearch: stubs.search,
                typeHistory: stubs.history,
            },
        },
    },
};

export const genericResources = baseResources;
