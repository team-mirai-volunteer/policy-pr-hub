const fs = require('fs');
const path = require('path');

function generateRoutesManifest() {
  const outDir = path.join(__dirname, '../out');
  const manifestPath = path.join(outDir, 'routes-manifest.json');
  
  const staticRoutes = [
    {
      page: '/',
      regex: '^/$',
      routeKeys: {},
      namedRegex: '^/$'
    },
    {
      page: '/hierarchical',
      regex: '^/hierarchical/?$',
      routeKeys: {},
      namedRegex: '^/hierarchical/?$'
    },
    {
      page: '/scatter',
      regex: '^/scatter/?$',
      routeKeys: {},
      namedRegex: '^/scatter/?$'
    },
    {
      page: '/pr/[id]',
      regex: '^/pr/([^/]+?)(?:/)?$',
      routeKeys: { id: 'id' },
      namedRegex: '^/pr/(?<id>[^/]+?)(?:/)?$'
    }
  ];

  const routesManifest = {
    version: 3,
    pages404: true,
    basePath: '',
    redirects: [],
    rewrites: [],
    headers: [],
    staticRoutes,
    dynamicRoutes: [
      {
        page: '/pr/[id]',
        regex: '^/pr/([^/]+?)(?:/)?$',
        routeKeys: { id: 'id' },
        namedRegex: '^/pr/(?<id>[^/]+?)(?:/)?$'
      }
    ],
    dataRoutes: []
  };

  fs.writeFileSync(manifestPath, JSON.stringify(routesManifest, null, 2));
  console.log('Generated routes-manifest.json for static export');
}

generateRoutesManifest();
