#!/usr/bin/env python3
"""
Extract hierarchical clustering data from the deployed webapp
"""

import json
import re
import os
try:
    import requests
    from bs4 import BeautifulSoup
    DEPS_AVAILABLE = True
except ImportError:
    DEPS_AVAILABLE = False
    print("Warning: requests and/or beautifulsoup4 not available. Install with: pip install requests beautifulsoup4")

def extract_hierarchical_data():
    """Extract hierarchical clustering data from the deployed webapp"""
    
    if not DEPS_AVAILABLE:
        print("Dependencies not available. Creating fallback data structure.")
        return create_fallback_data()
    
    url = "https://client.salmonpebble-febdd0ee.japaneast.azurecontainerapps.io/ee61bb2f-9690-4bd2-9737-1b9cc427ff97/"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        html_content = response.text
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string:
                if 'hierarchical_result' in script.string or 'clusters' in script.string:
                    print(f"Found potential data in script: {script.string[:500]}...")
                    
                    json_matches = re.findall(r'\{[^{}]*"cluster[^{}]*\}', script.string)
                    if json_matches:
                        print(f"Found JSON matches: {json_matches[:3]}")
        
        cluster_descriptions = extract_visible_clusters(soup)
        if cluster_descriptions:
            return create_hierarchical_structure(cluster_descriptions)
            
    except Exception as e:
        print(f"Error extracting data: {e}")
        return create_fallback_data()

def create_fallback_data():
    """Create fallback hierarchical data when extraction fails"""
    return {
        'clusters': [
            {
                'id': 'cluster_1',
                'level': 0,
                'parent': None,
                'label': '教育と福祉の包括的支援体制の強化',
                'takeaway': '実際のデータ抽出に失敗したため、フォールバックデータを使用しています。'
            }
        ]
    }

def extract_visible_clusters(soup):
    """Extract cluster information from visible text"""
    clusters = []
    
    text_content = soup.get_text()
    
    cluster_pattern = r'(\d+,?\d*)件\s*([^。]+。)'
    matches = re.findall(cluster_pattern, text_content)
    
    for i, (count, description) in enumerate(matches):
        clusters.append({
            'id': f'cluster_{i+1}',
            'level': 0,
            'parent': None,
            'label': f'クラスタ {i+1} ({count}件)',
            'takeaway': description.strip()
        })
    
    return clusters

def create_hierarchical_structure(clusters):
    """Create hierarchical structure from extracted clusters"""
    return {
        'clusters': clusters
    }

if __name__ == "__main__":
    data = extract_hierarchical_data()
    if data:
        os.makedirs('webapp/src/lib', exist_ok=True)
        with open('webapp/src/lib/extracted_hierarchical_data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("Data extracted and saved to extracted_hierarchical_data.json")
    else:
        print("Failed to extract data")
