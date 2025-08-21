#!/bin/bash

set -e

echo "Generating Voronoi polygons..."
cd backend
python generate_voronoi_polygons.py \
  --input ../webapp/src/data/hierarchical_result.json \
  --output voronoi_polygons.json \
  --level 1

echo "Copying polygons to webapp public directory..."
cp voronoi_polygons.json ../webapp/public/data/

echo "Polygon generation complete!"
echo "Generated polygons are available at /data/voronoi_polygons.json"
