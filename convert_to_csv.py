import json
import csv

def convert_problems_to_csv():
    with open('problems.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    with open('problems.csv', 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['text', 'url'])
        
        for pr_id, pr_data in data.items():
            pr_url = pr_data['pr_url']
            problems = pr_data['problems']
            
            for problem in problems:
                writer.writerow([problem, pr_url])

if __name__ == "__main__":
    convert_problems_to_csv()
    print("Conversion completed. Output saved to problems.csv")