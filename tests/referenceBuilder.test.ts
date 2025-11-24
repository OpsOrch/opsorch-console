import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildLogHref, buildMetricHref } from '../app/lib/referenceBuilder.js';
import { LogReference, MetricReference } from '../app/lib/types.js';

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
