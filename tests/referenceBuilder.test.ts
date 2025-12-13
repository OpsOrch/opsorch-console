import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildLogHref, buildMetricHref, buildDeploymentHref } from '../app/lib/referenceBuilder.js';
import { LogReference, MetricReference, DeploymentReference, DeploymentQuery } from '../app/lib/types.js';

describe('referenceBuilder', () => {
  describe('buildLogHref', () => {
    it('should encode search query', () => {
      const ref: LogReference = {
        expression: { search: 'error OR timeout' },
        start: '2025-11-24T12:00:00Z',
        end: '2025-11-24T13:00:00Z',
      };

      const href = buildLogHref(ref);

      assert.ok(href.includes('/logs?'));
      assert.ok(href.includes('search=error+OR+timeout'));
      assert.ok(href.includes('start=2025-11-24T12%3A00%3A00Z'));
      assert.ok(href.includes('end=2025-11-24T13%3A00%3A00Z'));
    });

    it('should encode filters', () => {
      const ref: LogReference = {
        expression: {
          search: 'error',
          filters: [
            { field: 'service', operator: '=', value: 'svc-notifications' },
            { field: 'environment', operator: '=', value: 'prod' },
          ],
        },
      };

      const href = buildLogHref(ref);

      assert.ok(href.includes('filters='));
      assert.ok(decodeURIComponent(href).includes('"field":"service"'));
      assert.ok(decodeURIComponent(href).includes('"value":"svc-notifications"'));
    });

    it('should encode severityIn', () => {
      const ref: LogReference = {
        expression: {
          search: 'error',
          severityIn: ['error', 'warn'],
        },
      };

      const href = buildLogHref(ref);

      assert.ok(href.includes('severityIn='));
      assert.ok(decodeURIComponent(href).includes('["error","warn"]'));
    });

    it('should encode scope', () => {
      const ref: LogReference = {
        expression: { search: 'error' },
        scope: { service: 'svc-notifications', environment: 'prod' },
      };

      const href = buildLogHref(ref);

      assert.ok(href.includes('scope='));
      assert.ok(decodeURIComponent(href).includes('"service":"svc-notifications"'));
      assert.ok(decodeURIComponent(href).includes('"environment":"prod"'));
    });

    it('should handle empty expression', () => {
      const ref: LogReference = {
        expression: {},
      };

      const href = buildLogHref(ref);

      assert.strictEqual(href, '/logs');
    });

    it('should encode all fields together', () => {
      const ref: LogReference = {
        expression: {
          search: 'error OR timeout OR lag OR backlog',
          filters: [
            { field: 'service', operator: '=', value: 'svc-notifications' },
            { field: 'environment', operator: '=', value: 'prod' },
          ],
          severityIn: ['error', 'warn'],
        },
        start: '2025-11-24T12:45:00Z',
        end: '2025-11-24T13:45:00Z',
        scope: {
          service: 'svc-notifications',
          environment: 'prod',
        },
      };

      const href = buildLogHref(ref);

      assert.ok(href.includes('/logs?'));
      assert.ok(href.includes('search='));
      assert.ok(href.includes('filters='));
      assert.ok(href.includes('severityIn='));
      assert.ok(href.includes('start='));
      assert.ok(href.includes('end='));
      assert.ok(href.includes('scope='));
    });
  });

  describe('buildMetricHref', () => {
    it('should encode metric name', () => {
      const ref: MetricReference = {
        expression: { metricName: 'process_resident_memory_bytes' },
        start: '2025-11-24T12:00:00Z',
        end: '2025-11-24T13:00:00Z',
      };

      const href = buildMetricHref(ref);

      assert.ok(href.includes('/metrics?'));
      assert.ok(href.includes('metricName=process_resident_memory_bytes'));
      assert.ok(href.includes('start=2025-11-24T12%3A00%3A00Z'));
      assert.ok(href.includes('end=2025-11-24T13%3A00%3A00Z'));
    });

    it('should encode aggregation', () => {
      const ref: MetricReference = {
        expression: {
          metricName: 'process_resident_memory_bytes',
          aggregation: 'avg',
        },
      };

      const href = buildMetricHref(ref);

      assert.ok(href.includes('aggregation=avg'));
    });

    it('should encode filters', () => {
      const ref: MetricReference = {
        expression: {
          metricName: 'process_resident_memory_bytes',
          filters: [
            { label: 'service', operator: '=', value: 'svc-notifications' },
          ],
        },
      };

      const href = buildMetricHref(ref);

      assert.ok(href.includes('filters='));
      assert.ok(decodeURIComponent(href).includes('"label":"service"'));
      assert.ok(decodeURIComponent(href).includes('"value":"svc-notifications"'));
    });

    it('should encode groupBy', () => {
      const ref: MetricReference = {
        expression: {
          metricName: 'process_resident_memory_bytes',
          groupBy: ['instance'],
        },
      };

      const href = buildMetricHref(ref);

      assert.ok(href.includes('groupBy='));
      assert.ok(decodeURIComponent(href).includes('["instance"]'));
    });

    it('should encode step', () => {
      const ref: MetricReference = {
        expression: { metricName: 'up' },
        step: 60,
      };

      const href = buildMetricHref(ref);

      assert.ok(href.includes('step=60'));
    });

    it('should encode scope', () => {
      const ref: MetricReference = {
        expression: { metricName: 'up' },
        scope: { service: 'svc-notifications', environment: 'prod' },
      };

      const href = buildMetricHref(ref);

      assert.ok(href.includes('scope='));
      assert.ok(decodeURIComponent(href).includes('"service":"svc-notifications"'));
      assert.ok(decodeURIComponent(href).includes('"environment":"prod"'));
    });

    it('should encode all fields together', () => {
      const ref: MetricReference = {
        expression: {
          metricName: 'process_resident_memory_bytes',
          aggregation: 'avg',
          filters: [
            { label: 'service', operator: '=', value: 'svc-notifications' },
          ],
          groupBy: ['instance'],
        },
        start: '2025-11-24T12:45:00Z',
        end: '2025-11-24T13:45:00Z',
        step: 60,
        scope: {
          service: 'svc-notifications',
          environment: 'prod',
        },
      };

      const href = buildMetricHref(ref);

      assert.ok(href.includes('/metrics?'));
      assert.ok(href.includes('metricName='));
      assert.ok(href.includes('aggregation='));
      assert.ok(href.includes('filters='));
      assert.ok(href.includes('groupBy='));
      assert.ok(href.includes('start='));
      assert.ok(href.includes('end='));
      assert.ok(href.includes('step='));
      assert.ok(href.includes('scope='));
    });

  });
});
  describe('buildDeploymentHref', () => {
    /**
     * Property 1: Deployment reference URL generation
     * For any valid deployment reference (either ID-based or query-based), 
     * the generated URL should contain the correct path and all specified parameters
     * Validates: Requirements 1.2, 1.3, 1.4, 1.5
     */
    
    it('should build URL for deployment ID string', () => {
      const deploymentIds = [
        'deploy-123',
        'abc-def-456', 
        'prod-checkout-v1.2.3',
        'staging-api-rollback-001'
      ];

      deploymentIds.forEach(deploymentId => {
        const href = buildDeploymentHref(deploymentId);
        assert.strictEqual(href, `/deployments/${deploymentId}`, 
          `Should generate correct detail URL for deployment ID: ${deploymentId}`);
      });
    });

    it('should build URL for deployment reference with ID', () => {
      const references: DeploymentReference[] = [
        { deploymentId: 'deploy-123' },
        { deploymentId: 'prod-api-v2.1.0' },
        { deploymentId: 'staging-checkout-rollback' }
      ];

      references.forEach(ref => {
        const href = buildDeploymentHref(ref);
        assert.strictEqual(href, `/deployments/${ref.deploymentId}`, 
          `Should generate correct detail URL for deployment reference with ID: ${ref.deploymentId}`);
      });
    });

    it('should build URL for deployment query with search', () => {
      const ref: DeploymentReference = {
        query: { query: 'checkout service' }
      };

      const href = buildDeploymentHref(ref);

      assert.ok(href.includes('/deployments?'), 'Should include deployments path with query');
      assert.ok(href.includes('query=checkout+service'), 'Should encode search query');
    });

    it('should build URL for deployment query with statuses', () => {
      const ref: DeploymentReference = {
        query: { statuses: ['success', 'failed'] }
      };

      const href = buildDeploymentHref(ref);

      assert.ok(href.includes('/deployments?'), 'Should include deployments path with query');
      assert.ok(href.includes('statuses='), 'Should include statuses parameter');
      assert.ok(decodeURIComponent(href).includes('["success","failed"]'), 'Should encode statuses array');
    });

    it('should build URL for deployment query with versions', () => {
      const ref: DeploymentReference = {
        query: { versions: ['v1.0.0', 'v2.1.0', 'latest'] }
      };

      const href = buildDeploymentHref(ref);

      assert.ok(href.includes('/deployments?'), 'Should include deployments path with query');
      assert.ok(href.includes('versions='), 'Should include versions parameter');
      assert.ok(decodeURIComponent(href).includes('["v1.0.0","v2.1.0","latest"]'), 'Should encode versions array');
    });

    it('should build URL for deployment query with scope', () => {
      const ref: DeploymentReference = {
        query: { 
          query: 'api deployment',
          scope: { service: 'api', environment: 'prod', team: 'backend' }
        }
      };

      const href = buildDeploymentHref(ref);

      assert.ok(href.includes('/deployments?'), 'Should include deployments path with query');
      assert.ok(href.includes('query=api+deployment'), 'Should encode search query');
      assert.ok(href.includes('scope='), 'Should include scope parameter');
      assert.ok(decodeURIComponent(href).includes('"service":"api"'), 'Should encode service in scope');
      assert.ok(decodeURIComponent(href).includes('"environment":"prod"'), 'Should encode environment in scope');
      assert.ok(decodeURIComponent(href).includes('"team":"backend"'), 'Should encode team in scope');
    });

    it('should build URL for deployment query with limit', () => {
      const ref: DeploymentReference = {
        query: { 
          query: 'checkout',
          limit: 50
        }
      };

      const href = buildDeploymentHref(ref);

      assert.ok(href.includes('/deployments?'), 'Should include deployments path with query');
      assert.ok(href.includes('query=checkout'), 'Should encode search query');
      assert.ok(href.includes('limit=50'), 'Should encode limit parameter');
    });

    it('should build URL with all deployment query fields', () => {
      const ref: DeploymentReference = {
        query: {
          query: 'checkout service deployment',
          statuses: ['success', 'failed', 'running'],
          versions: ['v2.1.0', 'latest'],
          limit: 25,
          scope: { service: 'checkout', environment: 'prod' }
        }
      };

      const href = buildDeploymentHref(ref);

      assert.ok(href.includes('/deployments?'), 'Should include deployments path with query');
      assert.ok(href.includes('query='), 'Should include query parameter');
      assert.ok(href.includes('statuses='), 'Should include statuses parameter');
      assert.ok(href.includes('versions='), 'Should include versions parameter');
      assert.ok(href.includes('limit=25'), 'Should include limit parameter');
      assert.ok(href.includes('scope='), 'Should include scope parameter');
      
      // Verify encoded content
      const decoded = decodeURIComponent(href);
      assert.ok(decoded.includes('checkout+service+deployment'), 'Should encode search query');
      assert.ok(decoded.includes('["success","failed","running"]'), 'Should encode statuses array');
      assert.ok(decoded.includes('["v2.1.0","latest"]'), 'Should encode versions array');
      assert.ok(decoded.includes('"service":"checkout"'), 'Should encode scope service');
      assert.ok(decoded.includes('"environment":"prod"'), 'Should encode scope environment');
    });

    it('should handle empty deployment reference', () => {
      const ref: DeploymentReference = {};

      const href = buildDeploymentHref(ref);

      assert.strictEqual(href, '/deployments', 'Should return base deployments path for empty reference');
    });

    it('should handle deployment reference with empty query', () => {
      const ref: DeploymentReference = {
        query: {}
      };

      const href = buildDeploymentHref(ref);

      assert.strictEqual(href, '/deployments', 'Should return base deployments path for empty query');
    });

    it('should prioritize deploymentId over query', () => {
      const ref: DeploymentReference = {
        deploymentId: 'deploy-123',
        query: { query: 'checkout' }
      };

      const href = buildDeploymentHref(ref);

      assert.strictEqual(href, '/deployments/deploy-123', 
        'Should use deploymentId and ignore query when both are present');
    });

    it('should handle deployment query with only empty arrays', () => {
      const ref: DeploymentReference = {
        query: {
          statuses: [],
          versions: []
        }
      };

      const href = buildDeploymentHref(ref);

      assert.strictEqual(href, '/deployments', 
        'Should return base path when query contains only empty arrays');
    });

    it('should preserve URL encoding for special characters', () => {
      const ref: DeploymentReference = {
        query: {
          query: 'deployment with spaces & symbols',
          scope: { service: 'api-service', environment: 'prod-env' }
        }
      };

      const href = buildDeploymentHref(ref);

      assert.ok(href.includes('/deployments?'), 'Should include deployments path with query');
      assert.ok(href.includes('query=deployment+with+spaces+%26+symbols'), 
        'Should properly encode special characters in query');
      assert.ok(href.includes('scope='), 'Should include scope parameter');
      
      // Verify scope encoding
      const decoded = decodeURIComponent(href);
      assert.ok(decoded.includes('"service":"api-service"'), 'Should encode hyphenated service name');
      assert.ok(decoded.includes('"environment":"prod-env"'), 'Should encode hyphenated environment name');
    });
  });
  describe('error handling and fallbacks', () => {
    /**
     * Property 6: Error handling fallback behavior
     * For any invalid or malformed deployment reference, the system should provide 
     * appropriate fallback navigation without throwing errors
     * Validates: Requirements 3.5
     */
    
    it('should handle null and undefined deployment references gracefully', () => {
      // These should not throw errors and should provide fallback URLs
      const nullRef = buildDeploymentHref(null as unknown as string);
      const undefinedRef = buildDeploymentHref(undefined as unknown as string);
      
      // Should fallback to base deployments page
      assert.strictEqual(nullRef, '/deployments', 'Should fallback to base path for null reference');
      assert.strictEqual(undefinedRef, '/deployments', 'Should fallback to base path for undefined reference');
    });

    it('should handle empty string deployment ID gracefully', () => {
      const emptyStringRef = buildDeploymentHref('');
      
      // Empty string is falsy, so should fallback to base deployments page
      assert.strictEqual(emptyStringRef, '/deployments', 'Should fallback to base path for empty string deployment ID');
    });

    it('should handle malformed deployment reference objects gracefully', () => {
      // Test various malformed objects
      const malformedRefs = [
        {},
        { invalidField: 'value' },
        { deploymentId: null },
        { deploymentId: undefined },
        { query: null },
        { query: undefined },
        { deploymentId: '', query: {} },
      ];

      malformedRefs.forEach((ref, index) => {
        // Should not throw errors
        const href = buildDeploymentHref(ref as DeploymentReference);
        
        // Should provide valid fallback URLs
        assert.ok(typeof href === 'string', `Malformed ref ${index} should return string`);
        assert.ok(href.startsWith('/deployments'), `Malformed ref ${index} should start with /deployments`);
      });
    });

    it('should handle deployment references with invalid query objects gracefully', () => {
      const invalidQueryRefs = [
        { query: 'invalid-string-query' as unknown as DeploymentQuery },
        { query: 123 as unknown as DeploymentQuery },
        { query: [] as unknown as DeploymentQuery },
        { query: { invalidField: 'value' } as unknown as DeploymentQuery },
        { query: { query: null } as unknown as DeploymentQuery },
        { query: { statuses: 'not-an-array' } as unknown as DeploymentQuery },
        { query: { versions: null } as unknown as DeploymentQuery },
        { query: { limit: 'not-a-number' } as unknown as DeploymentQuery },
      ];

      invalidQueryRefs.forEach((ref, index) => {
        // Should not throw errors
        const href = buildDeploymentHref(ref);
        
        // Should provide valid fallback URLs
        assert.ok(typeof href === 'string', `Invalid query ref ${index} should return string`);
        assert.ok(href.startsWith('/deployments'), `Invalid query ref ${index} should start with /deployments`);
      });
    });

    it('should handle deployment references with circular objects gracefully', () => {
      // Create circular reference
      const circularObj: DeploymentReference & { circular?: unknown } = { deploymentId: 'test' };
      circularObj.circular = circularObj;
      
      // Should not throw errors (though JSON.stringify might fail internally)
      const href = buildDeploymentHref(circularObj);
      
      // Should still provide valid URL using deploymentId
      assert.strictEqual(href, '/deployments/test', 'Should handle circular references by using deploymentId');
    });

    it('should handle deployment references with very large objects gracefully', () => {
      // Create a large query object
      const largeQuery = {
        query: 'test'.repeat(1000),
        statuses: Array(100).fill('success'),
        versions: Array(100).fill('v1.0.0'),
        scope: {
          service: 'service'.repeat(100),
          environment: 'env'.repeat(100),
          team: 'team'.repeat(100),
        }
      };
      
      const ref = { query: largeQuery };
      
      // Should not throw errors
      const href = buildDeploymentHref(ref);
      
      // Should provide valid URL
      assert.ok(typeof href === 'string', 'Should handle large objects');
      assert.ok(href.startsWith('/deployments'), 'Should start with /deployments for large objects');
    });

    it('should prioritize deploymentId over malformed query', () => {
      const ref = {
        deploymentId: 'valid-deployment',
        query: 'invalid-query-format' as unknown as DeploymentQuery
      };
      
      const href = buildDeploymentHref(ref);
      
      // Should use deploymentId and ignore malformed query
      assert.strictEqual(href, '/deployments/valid-deployment', 
        'Should prioritize valid deploymentId over malformed query');
    });

    it('should handle special characters in deployment IDs gracefully', () => {
      const specialCharIds = [
        'deployment with spaces',
        'deployment/with/slashes',
        'deployment?with=query&params',
        'deployment#with-hash',
        'deployment%20encoded',
        'deployment<script>alert("xss")</script>',
      ];

      specialCharIds.forEach(deploymentId => {
        // Should not throw errors
        const href = buildDeploymentHref(deploymentId);
        
        // Should create valid URLs (browser will handle encoding)
        assert.ok(typeof href === 'string', `Should handle special chars in ID: ${deploymentId}`);
        assert.ok(href.startsWith('/deployments/'), `Should create valid path for ID: ${deploymentId}`);
        assert.ok(href.includes(deploymentId), `Should include deployment ID in path: ${deploymentId}`);
      });
    });
  });