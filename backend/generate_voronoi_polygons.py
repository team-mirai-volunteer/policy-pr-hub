#!/usr/bin/env python3
"""
Voronoi polygon generation script for policy-pr-hub

This script processes hierarchical_result.json to generate Voronoi polygons
for cluster visualization, addressing performance issues from client-side implementation.
"""

import json
import sys
import argparse
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from scipy.spatial import Voronoi
from shapely.geometry import Polygon, Point, MultiPolygon
from shapely.ops import unary_union
import geopandas as gpd
import pandas as pd

SOFT_COLORS = [
    "#7ac943",
    "#3fa9f5",
    "#ff7997",
    "#e0dd02",
    "#d6410f",
    "#b39647",
    "#7cccc3",
    "#a147e6",
    "#ff6b6b",
    "#4ecdc4",
    "#ffbe0b",
    "#fb5607",
    "#8338ec",
    "#3a86ff",
    "#ff006e",
    "#8ac926",
    "#1982c4",
    "#6a4c93",
    "#f72585",
    "#7209b7",
    "#00b4d8",
    "#e76f51",
    "#606c38",
    "#9d4edd",
]


class VoronoiPolygonGenerator:
    def __init__(self, data_path: str):
        """Initialize with path to hierarchical_result.json"""
        self.data_path = Path(data_path)
        self.data = self._load_data()

    def _load_data(self) -> Dict[str, Any]:
        """Load and validate hierarchical result data"""
        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            required_keys = ["arguments", "clusters"]
            for key in required_keys:
                if key not in data:
                    raise ValueError(f"Missing required key: {key}")

            print(
                f"Loaded data with {len(data['arguments'])} arguments and {len(data['clusters'])} clusters"
            )
            return data

        except FileNotFoundError:
            raise FileNotFoundError(f"Data file not found: {self.data_path}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in data file: {e}")

    def _calculate_bounds(
        self, points: List[Tuple[float, float]]
    ) -> Tuple[float, float, float, float]:
        """Calculate bounding box for points with margin"""
        if not points:
            return 0, 0, 0, 0

        x_coords = [p[0] for p in points]
        y_coords = [p[1] for p in points]

        min_x, max_x = min(x_coords), max(x_coords)
        min_y, max_y = min(y_coords), max(y_coords)

        margin_x = (max_x - min_x) * 0.1
        margin_y = (max_y - min_y) * 0.1

        return (min_x - margin_x, min_y - margin_y, max_x + margin_x, max_y + margin_y)

    def _create_circle_polygon(
        self, center_x: float, center_y: float, radius: float, segments: int = 32
    ) -> Polygon:
        """Create a circular polygon around a point"""
        angles = np.linspace(0, 2 * np.pi, segments, endpoint=False)
        points = [
            (center_x + radius * np.cos(angle), center_y + radius * np.sin(angle))
            for angle in angles
        ]
        return Polygon(points)

    def generate_polygons(self, target_level: int = 1) -> List[Dict[str, Any]]:
        """Generate Voronoi polygons for specified cluster level"""
        arguments = self.data["arguments"]
        clusters = self.data["clusters"]

        if not arguments:
            print("No arguments found in data")
            return []

        target_clusters = [c for c in clusters if c.get("level") == target_level]
        if not target_clusters:
            print(f"No clusters found at level {target_level}")
            return []

        print(f"Processing {len(target_clusters)} clusters at level {target_level}")

        cluster_colors = {
            cluster["id"]: SOFT_COLORS[i % len(SOFT_COLORS)]
            for i, cluster in enumerate(target_clusters)
        }

        points = [(arg["x"], arg["y"]) for arg in arguments]
        bounds = self._calculate_bounds(points)

        bound_size = max(bounds[2] - bounds[0], bounds[3] - bounds[1])
        circle_radius = bound_size * 0.05

        print(f"Data bounds: {bounds}, circle radius: {circle_radius:.3f}")

        try:
            vor = Voronoi(points)

            cluster_groups = {}
            for i, arg in enumerate(arguments):
                for cluster_id in arg.get("cluster_ids", []):
                    if cluster_id in cluster_colors:
                        if cluster_id not in cluster_groups:
                            cluster_groups[cluster_id] = []
                        cluster_groups[cluster_id].append((i, arg))

            polygons = []

            for cluster_id, cluster_args in cluster_groups.items():
                print(
                    f"Processing cluster {cluster_id} with {len(cluster_args)} arguments"
                )

                cluster_polygons = []

                for point_idx, arg in cluster_args:
                    try:
                        if point_idx >= len(vor.point_region):
                            continue

                        region_idx = vor.point_region[point_idx]
                        if region_idx == -1:  # Point at infinity
                            continue

                        region = vor.regions[region_idx]
                        if not region or -1 in region:  # Unbounded region
                            continue

                        cell_vertices = [vor.vertices[i] for i in region]
                        if len(cell_vertices) < 3:
                            continue

                        cell_polygon = Polygon(cell_vertices)

                        circle = self._create_circle_polygon(
                            arg["x"], arg["y"], circle_radius
                        )

                        intersection = cell_polygon.intersection(circle)

                        if intersection.is_valid and not intersection.is_empty:
                            if isinstance(intersection, Polygon):
                                cluster_polygons.append(intersection)
                            elif isinstance(intersection, MultiPolygon):
                                cluster_polygons.extend(list(intersection.geoms))

                    except Exception as e:
                        print(f"Error processing point {point_idx}: {e}")
                        continue

                if cluster_polygons:
                    try:
                        if len(cluster_polygons) == 1:
                            union_polygon = cluster_polygons[0]
                        else:
                            union_polygon = unary_union(cluster_polygons)

                        if union_polygon.is_valid and not union_polygon.is_empty:
                            coordinates = self._polygon_to_coordinates(union_polygon)
                            if coordinates:
                                polygons.append(
                                    {
                                        "cluster_id": cluster_id,
                                        "coordinates": coordinates,
                                        "color": cluster_colors[cluster_id],
                                    }
                                )

                    except Exception as e:
                        print(f"Error creating union for cluster {cluster_id}: {e}")

            print(f"Generated {len(polygons)} polygons")
            return polygons

        except Exception as e:
            print(f"Error generating Voronoi diagram: {e}")
            return []

    def _polygon_to_coordinates(
        self, polygon: Polygon
    ) -> Optional[List[List[List[float]]]]:
        """Convert Shapely polygon to coordinate format for frontend"""
        try:
            if isinstance(polygon, MultiPolygon):
                polygon = max(polygon.geoms, key=lambda p: p.area)

            coords = list(polygon.exterior.coords)
            if len(coords) < 4:  # Need at least 3 points + closing point
                return None

            return [[list(coord) for coord in coords]]

        except Exception as e:
            print(f"Error converting polygon to coordinates: {e}")
            return None

    def save_polygons(self, polygons: List[Dict[str, Any]], output_path: str):
        """Save generated polygons to JSON file"""
        output_data = {
            "polygons": polygons,
            "metadata": {
                "generated_at": pd.Timestamp.now().isoformat(),
                "source_file": str(self.data_path),
                "polygon_count": len(polygons),
            },
        }

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)

        print(f"Saved {len(polygons)} polygons to {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate Voronoi polygons for cluster visualization"
    )
    parser.add_argument(
        "--input",
        "-i",
        default="../webapp/src/data/hierarchical_result.json",
        help="Path to hierarchical_result.json file",
    )
    parser.add_argument(
        "--output",
        "-o",
        default="voronoi_polygons.json",
        help="Output file for generated polygons",
    )
    parser.add_argument(
        "--level", "-l", type=int, default=1, help="Target cluster level to process"
    )

    args = parser.parse_args()

    try:
        generator = VoronoiPolygonGenerator(args.input)
        polygons = generator.generate_polygons(target_level=args.level)

        if polygons:
            generator.save_polygons(polygons, args.output)
            print(f"Successfully generated {len(polygons)} polygons")
        else:
            print("No polygons generated")
            sys.exit(1)

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
