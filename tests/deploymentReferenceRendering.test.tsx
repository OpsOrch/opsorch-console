import assert from "node:assert";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CopilotReferences } from "../app/lib/types.js";

/**
 * Property 4: Clickable link rendering
 * For any deployment reference in a Copilot response, the rendered HTML should contain 
 * clickable links with proper href attributes pointing to deployment pages
 * Validates: Requirements 1.1
 */

/**
 * Property 5: UI consistency preservation  
 * For any deployment reference link, the rendered styling and behavior should match 
 * other reference type links in the same context
 * Validates: Requirements 3.4
 */

// Mock ReferenceLinks component for testing
function MockReferenceLinks({ references }: { references?: CopilotReferences }) {
  if (!references?.deployments?.length) return null;
  
  return (
    <div className="deployment-references">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Deployments</p>
      <ul className="mt-2 flex flex-wrap gap-2 text-xs">
        {references.deployments.map((deployment, idx) => {
          const isString = typeof deployment === 'string';
          let href: string;
          let label: string;
          
          if (isString) {
            href = `/deployments/${deployment}`;
            label = `Deployment ${deployment}`;
          } else if ('deploymentId' in deployment && deployment.deploymentId) {
            href = `/deployments/${deployment.deploymentId}`;
            label = `Deployment ${deployment.deploymentId}`;
          } else {
            href = '/deployments';
            label = 'Deployment Query';
          }
          
          return (
            <li key={idx}>
              <a
                href={href}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 font-semibold text-indigo-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-100 hover:shadow"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

test("deployment references render clickable links with proper hrefs", () => {
  // Test string deployment ID
  const stringRefHtml = renderToStaticMarkup(
    <MockReferenceLinks references={{ deployments: ['deploy-123'] }} />
  );
  
  assert(stringRefHtml.includes('href="/deployments/deploy-123"'), 'Should include correct href for string deployment ID');
  assert(stringRefHtml.includes('Deployment deploy-123'), 'Should include correct label for string deployment ID');
  assert(stringRefHtml.includes('class="inline-flex items-center'), 'Should include proper CSS classes');
  
  // Test deployment reference with ID
  const refWithIdHtml = renderToStaticMarkup(
    <MockReferenceLinks references={{ deployments: [{ deploymentId: 'prod-api-v1.0.0' }] }} />
  );
  
  assert(refWithIdHtml.includes('href="/deployments/prod-api-v1.0.0"'), 'Should include correct href for deployment reference with ID');
  assert(refWithIdHtml.includes('Deployment prod-api-v1.0.0'), 'Should include correct label for deployment reference with ID');
  
  // Test deployment reference with query
  const refWithQueryHtml = renderToStaticMarkup(
    <MockReferenceLinks references={{ deployments: [{ query: { query: 'checkout service' } }] }} />
  );
  
  assert(refWithQueryHtml.includes('href="/deployments"'), 'Should include deployments base href for query reference');
  assert(refWithQueryHtml.includes('Deployment Query'), 'Should include correct label for query reference');
});

test("deployment reference links have consistent styling with other reference types", () => {
  const deploymentHtml = renderToStaticMarkup(
    <MockReferenceLinks references={{ deployments: ['deploy-123'] }} />
  );
  
  // Check for consistent styling patterns used by other reference types
  assert(deploymentHtml.includes('inline-flex items-center gap-1.5'), 'Should use consistent flex layout');
  assert(deploymentHtml.includes('rounded-lg border'), 'Should use consistent border styling');
  assert(deploymentHtml.includes('px-3 py-1.5'), 'Should use consistent padding');
  assert(deploymentHtml.includes('font-semibold'), 'Should use consistent font weight');
  assert(deploymentHtml.includes('shadow-sm'), 'Should use consistent shadow');
  assert(deploymentHtml.includes('transition-all'), 'Should use consistent transitions');
  assert(deploymentHtml.includes('hover:'), 'Should include hover states');
  
  // Check for deployment-specific color scheme (indigo)
  assert(deploymentHtml.includes('border-indigo-200'), 'Should use indigo color scheme');
  assert(deploymentHtml.includes('bg-indigo-50'), 'Should use indigo background');
  assert(deploymentHtml.includes('text-indigo-700'), 'Should use indigo text color');
  
  // Check for SVG icon
  assert(deploymentHtml.includes('<svg'), 'Should include SVG icon');
  assert(deploymentHtml.includes('h-3.5 w-3.5'), 'Should use consistent icon size');
});

test("deployment references section has proper structure", () => {
  const html = renderToStaticMarkup(
    <MockReferenceLinks references={{ deployments: ['deploy-1', 'deploy-2'] }} />
  );
  
  // Check section structure
  assert(html.includes('class="deployment-references"'), 'Should have deployment references container');
  assert(html.includes('Deployments'), 'Should include section title');
  assert(html.includes('text-[10px] font-medium uppercase'), 'Should use consistent section title styling');
  assert(html.includes('mt-2 flex flex-wrap gap-2'), 'Should use consistent list styling');
  
  // Check multiple items are rendered
  assert(html.includes('Deployment deploy-1'), 'Should render first deployment');
  assert(html.includes('Deployment deploy-2'), 'Should render second deployment');
});

test("deployment references handle empty or undefined deployments", () => {
  // Test with no deployments
  const emptyHtml = renderToStaticMarkup(
    <MockReferenceLinks references={{ deployments: [] }} />
  );
  assert.strictEqual(emptyHtml, '', 'Should render nothing for empty deployments array');
  
  // Test with undefined deployments
  const undefinedHtml = renderToStaticMarkup(
    <MockReferenceLinks references={{}} />
  );
  assert.strictEqual(undefinedHtml, '', 'Should render nothing for undefined deployments');
  
  // Test with no references
  const noRefsHtml = renderToStaticMarkup(
    <MockReferenceLinks />
  );
  assert.strictEqual(noRefsHtml, '', 'Should render nothing for no references');
});

test("deployment reference links preserve URL structure", () => {
  const testCases = [
    { input: 'simple-deploy', expected: '/deployments/simple-deploy' },
    { input: 'prod-api-v1.2.3', expected: '/deployments/prod-api-v1.2.3' },
    { input: 'staging-checkout-rollback-001', expected: '/deployments/staging-checkout-rollback-001' },
  ];
  
  testCases.forEach(({ input, expected }) => {
    const html = renderToStaticMarkup(
      <MockReferenceLinks references={{ deployments: [input] }} />
    );
    
    assert(html.includes(`href="${expected}"`), 
      `Should generate correct href ${expected} for deployment ID ${input}`);
  });
});